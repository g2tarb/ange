import supabase from '../services/supabase.js';
import { generateWeeklyRecap } from '../services/claude.js';

// ============================================================
// RÉCOMPENSES HEBDO TOP 5
// ============================================================
const WEEKLY_REWARDS = [
  { rank: 1, ctm: 10000, title: 'Élu de la Semaine' },
  { rank: 2, ctm: 5000,  title: 'Âme Bénie' },
  { rank: 3, ctm: 3000,  title: 'Lumière' },
  { rank: 4, ctm: 1500,  title: null },
  { rank: 5, ctm: 1000,  title: null }
];

// ============================================================
// MISE À JOUR DES SCORES HEBDO (toutes les heures)
// ============================================================
export async function updateWeeklyScores() {
  try {
    console.log('📊 Mise à jour des scores hebdomadaires...');

    // Récupérer tous les personnages vivants
    const { data: characters } = await supabase
      .from('characters')
      .select('id, user_id, health, happiness, wealth, morality, karma, age')
      .eq('alive', true);

    if (!characters || characters.length === 0) return;

    // Compter les amis vivants de chaque joueur
    for (const char of characters) {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_a, user_b')
        .or(`user_a.eq.${char.user_id},user_b.eq.${char.user_id}`)
        .eq('status', 'accepted');

      let friendCount = 0;
      let friendsKilled = 0;

      if (friendships) {
        const friendUserIds = friendships.map(f =>
          f.user_a === char.user_id ? f.user_b : f.user_a
        );

        if (friendUserIds.length > 0) {
          const { data: friendChars } = await supabase
            .from('characters')
            .select('alive')
            .in('user_id', friendUserIds);

          friendCount = friendChars?.filter(fc => fc.alive).length || 0;
          friendsKilled = friendChars?.filter(fc => !fc.alive).length || 0;
        }
      }

      // Calculer le score
      const score = (char.health * 1.0)
        + (char.happiness * 1.5)
        + (char.wealth * 0.8)
        + (char.morality * 1.2)
        + (char.karma * 2.0)
        + (char.age * 3.0)
        + (friendCount * 10.0)
        - (friendsKilled * 50.0);

      await supabase.from('characters').update({
        weekly_score: Math.max(0, score)
      }).eq('id', char.id);
    }

    console.log(`📊 ${characters.length} scores mis à jour`);
  } catch (err) {
    console.error('Score update error:', err);
  }
}

// ============================================================
// CLÔTURE HEBDOMADAIRE (chaque lundi à 00:00)
// ============================================================
export async function closeWeeklyLeaderboard() {
  try {
    console.log('🏆 Clôture du classement hebdomadaire...');

    const now = new Date();
    const weekEnd = now.toISOString().split('T')[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Mettre à jour les scores une dernière fois
    await updateWeeklyScores();

    // Récupérer le top 50
    const { data: topChars } = await supabase
      .from('characters')
      .select('id, user_id, name, age, health, happiness, wealth, morality, karma, current_avatar, weekly_score')
      .eq('alive', true)
      .order('weekly_score', { ascending: false })
      .limit(50);

    if (!topChars || topChars.length === 0) {
      console.log('🏆 Aucun personnage vivant pour le classement');
      return;
    }

    // Récupérer les usernames
    const userIds = topChars.map(c => c.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, username, ctm_balance')
      .in('id', userIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    // Enregistrer le classement et distribuer les récompenses
    for (let i = 0; i < topChars.length; i++) {
      const char = topChars[i];
      const rank = i + 1;
      const reward = WEEKLY_REWARDS.find(r => r.rank === rank);
      const user = userMap[char.user_id];

      // Enregistrer dans l'historique
      await supabase.from('leaderboard_history').insert({
        week_start: weekStart,
        week_end: weekEnd,
        character_id: char.id,
        user_id: char.user_id,
        username: user?.username || '???',
        character_name: char.name,
        rank,
        score: char.weekly_score,
        age: char.age,
        karma: char.karma,
        avatar: char.current_avatar,
        ctm_reward: reward?.ctm || 0,
        title_reward: reward?.title || null
      });

      // Distribuer les CTM pour le top 5
      if (reward && user) {
        await supabase.from('users').update({
          ctm_balance: user.ctm_balance + reward.ctm
        }).eq('id', char.user_id);

        await supabase.from('ctm_rewards').insert({
          user_id: char.user_id,
          reason: 'weekly_top5',
          amount: reward.ctm
        });

        // Ajouter le titre si applicable
        if (reward.title) {
          const currentTitles = char.earned_titles || [];
          if (!currentTitles.includes(reward.title)) {
            await supabase.from('characters').update({
              earned_titles: [...currentTitles, reward.title],
              current_title: reward.title,
              best_weekly_rank: rank
            }).eq('id', char.id);
          }
        }

        console.log(`🏆 #${rank} ${char.name} (@${user.username}) → +${reward.ctm} CTM${reward.title ? ` + titre "${reward.title}"` : ''}`);
      }
    }

    // Réinitialiser les scores hebdo
    await supabase.from('characters').update({ weekly_score: 0 }).eq('alive', true);

    console.log('🏆 Classement hebdomadaire clôturé !');
  } catch (err) {
    console.error('Weekly close error:', err);
  }
}
