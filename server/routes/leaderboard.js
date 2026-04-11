import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../services/supabase.js';

const router = Router();

// ============================================================
// GET /api/leaderboard/current — Classement en temps réel
// ============================================================
router.get('/current', authenticate, async (req, res) => {
  try {
    // Récupérer tous les personnages vivants avec un score calculé
    const { data: characters } = await supabase
      .from('characters')
      .select(`
        id, user_id, name, age, day,
        health, happiness, wealth, morality, karma,
        current_avatar, total_chapters, weekly_score, alive
      `)
      .eq('alive', true)
      .order('weekly_score', { ascending: false })
      .limit(100);

    if (!characters) return res.json({ leaderboard: [], myRank: null });

    // Récupérer les usernames
    const userIds = [...new Set(characters.map(c => c.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    const usernameMap = {};
    (users || []).forEach(u => { usernameMap[u.id] = u.username; });

    // Compter les amis de chaque joueur
    const leaderboard = characters.map((c, idx) => ({
      rank: idx + 1,
      username: usernameMap[c.user_id] || '???',
      characterName: c.name,
      age: c.age,
      score: Math.round(c.weekly_score),
      karma: Math.round(c.karma),
      avatar: c.current_avatar,
      stats: {
        health: Math.round(c.health),
        happiness: Math.round(c.happiness),
        wealth: Math.round(c.wealth),
        morality: Math.round(c.morality)
      },
      isMe: c.user_id === req.userId
    }));

    // Trouver le rang du joueur
    const myEntry = leaderboard.find(e => e.isMe);

    res.json({
      leaderboard: leaderboard.slice(0, 50),
      myRank: myEntry || null,
      totalPlayers: characters.length
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/leaderboard/history — Historique des classements
// ============================================================
router.get('/history', authenticate, async (req, res) => {
  try {
    // 4 dernières semaines
    const { data: history } = await supabase
      .from('leaderboard_history')
      .select('*')
      .order('week_start', { ascending: false })
      .order('rank', { ascending: true })
      .limit(100);

    // Grouper par semaine
    const weeks = {};
    (history || []).forEach(h => {
      const key = h.week_start;
      if (!weeks[key]) weeks[key] = { week_start: h.week_start, week_end: h.week_end, entries: [] };
      weeks[key].entries.push(h);
    });

    res.json({ weeks: Object.values(weeks).slice(0, 4) });
  } catch (err) {
    console.error('Leaderboard history error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/leaderboard/my-history — Mon historique perso
// ============================================================
router.get('/my-history', authenticate, async (req, res) => {
  try {
    const { data: myHistory } = await supabase
      .from('leaderboard_history')
      .select('*')
      .eq('user_id', req.userId)
      .order('week_start', { ascending: false })
      .limit(12);

    res.json({ history: myHistory || [] });
  } catch (err) {
    console.error('My leaderboard history error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
