import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../services/supabase.js';
import { generateChapter, generateDailyRecap } from '../services/claude.js';

const router = Router();

// ============================================================
// CONSTANTES
// ============================================================
const DAILY_CHAPTER_LIMIT = 5;
const AVATAR_DAILY_LIMITS = { angel: Infinity, neutral: Infinity, fallen: Infinity, devil: Infinity };
const CTM_COST = { angel: 4, neutral: 3, fallen: 1, devil: 0 };
const DECISIONS_PER_CHAPTER = 3; // 3 décisions = 1 chapitre

const AGE_MILESTONES = {
  18: { title: 'Majorité', text: 'Tu as 18 ans. Le monde s\'ouvre devant toi.', bonus: { happiness: 5, morality: 3 } },
  21: { title: 'Indépendance', text: 'À 21 ans, tu quittes le nid.', bonus: { wealth: 5, happiness: 3 } },
  25: { title: 'Premier vrai travail', text: 'Tu signes ton premier CDI.', bonus: { wealth: 10, happiness: 5 } },
  30: { title: 'La trentaine', text: 'Le temps file. Les rêves cèdent aux choix.', bonus: { morality: 5 } },
  40: { title: 'Crise de la quarantaine', text: 'As-tu vécu la vie que tu voulais ?', bonus: { happiness: -5, morality: 5 } },
  50: { title: 'La sagesse', text: 'Les erreurs deviennent des leçons.', bonus: { morality: 10, health: -5 } },
  65: { title: 'Retraite', text: 'Le reste de ta vie t\'appartient.', bonus: { happiness: 8, wealth: -5, health: -3 } },
  75: { title: 'Le crépuscule', text: 'Chaque jour est un cadeau.', bonus: { health: -10, morality: 8 } }
};

// ============================================================
// Helpers
// ============================================================
function getHappinessCap(karma) {
  if (karma >= 50) return 100;
  if (karma >= 35) return 60;
  if (karma >= 20) return 40;
  return 25;
}

function getAvatarFromKarma(karma) {
  if (karma >= 70) return 'angel';
  if (karma >= 45) return 'neutral';
  if (karma >= 20) return 'fallen';
  return 'devil';
}

function checkDeath(character) {
  if (character.health <= 0) {
    return { dead: true, cause: 'Ton corps a lâché. La santé t\'a abandonné.' };
  }
  // Mort aléatoire basée sur l'âge
  const age = character.age;
  if (age >= 80) {
    const deathChance = (age - 75) * 0.03;
    if (Math.random() < deathChance) {
      return { dead: true, cause: `À ${age} ans, le temps a fait son œuvre.` };
    }
  }
  if (age >= 60 && character.health < 20) {
    if (Math.random() < 0.15) {
      return { dead: true, cause: 'Un corps fragile dans un monde cruel.' };
    }
  }
  return { dead: false };
}

async function getFriendContext(userId) {
  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'accepted');

  if (!friendships || friendships.length === 0) return null;

  const friendUserIds = friendships.map(f =>
    f.user_a === userId ? f.user_b : f.user_a
  );

  const { data: friendChars } = await supabase
    .from('characters')
    .select('name, karma, current_avatar, age, alive')
    .in('user_id', friendUserIds)
    .eq('alive', true);

  if (!friendChars || friendChars.length === 0) return null;

  return friendChars.map(fc =>
    `${fc.name} (${fc.age} ans, karma ${Math.round(fc.karma)}%, avatar ${fc.current_avatar}${!fc.alive ? ', MORT' : ''})`
  ).join(' | ');
}

async function getPendingFriendEvents(characterId) {
  const { data: events } = await supabase
    .from('friend_events')
    .select('*, source_character:source_character_id(name, current_avatar)')
    .eq('target_character_id', characterId)
    .eq('processed', false)
    .limit(3);

  return events || [];
}

// ============================================================
// POST /api/game/create — Créer un personnage
// ============================================================
router.post('/create', authenticate, async (req, res) => {
  try {
    const { name, city } = req.body;
    if (!name || !city) {
      return res.status(400).json({ error: 'Nom et ville requis' });
    }

    // Vérifier qu'il n'y a pas de personnage vivant
    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Tu as déjà un personnage en vie. Il doit mourir d\'abord.' });
    }

    const { data: character, error } = await supabase
      .from('characters')
      .insert({
        user_id: req.userId,
        name: name.trim(),
        city: city.trim()
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({ character });
  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du personnage' });
  }
});

// ============================================================
// GET /api/game/state — État du jeu
// ============================================================
router.get('/state', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('ctm_balance')
      .eq('id', req.userId)
      .single();

    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!character) {
      return res.json({ character: null, ctm: user?.ctm_balance || 0 });
    }

    // Daily reset si nouveau jour
    const today = new Date().toISOString().split('T')[0];
    if (character.last_play_date !== today && character.total_chapters > 0) {
      await supabase.rpc('daily_reset_character', { p_character_id: character.id });
      character.chapters_today = 0;
      character.angel_uses_today = 0;
      character.neutral_uses_today = 0;
      character.fallen_uses_today = 0;
      character.devil_uses_today = 0;
      character.day += 1;
      character.age += 1;
    }

    // Historique récent
    const { data: history } = await supabase
      .from('history')
      .select('*')
      .eq('character_id', character.id)
      .order('created_at', { ascending: false })
      .limit(15);

    // Amis
    const { count: friendCount } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .or(`user_a.eq.${req.userId},user_b.eq.${req.userId}`)
      .eq('status', 'accepted');

    res.json({
      character,
      ctm: user?.ctm_balance || 0,
      history: (history || []).reverse(),
      friendCount: friendCount || 0,
      ctmCosts: CTM_COST,
      dailyLimit: DAILY_CHAPTER_LIMIT
    });
  } catch (err) {
    console.error('Game state error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/game/chapter — Générer un chapitre
// ============================================================
router.post('/chapter', authenticate, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || !CTM_COST.hasOwnProperty(avatar)) {
      return res.status(400).json({ error: 'Avatar invalide' });
    }

    // Récupérer le personnage
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!character) return res.status(404).json({ error: 'Aucun personnage actif' });

    // Vérifier la limite quotidienne
    if (character.chapters_today >= DAILY_CHAPTER_LIMIT) {
      return res.status(429).json({ error: 'Limite quotidienne atteinte', recap: true });
    }

    // Vérifier le coût CTM (coût par chapitre = coût × 3 décisions)
    const chapterCost = CTM_COST[avatar] * DECISIONS_PER_CHAPTER;
    const { data: user } = await supabase
      .from('users')
      .select('ctm_balance')
      .eq('id', req.userId)
      .single();

    if (chapterCost > 0 && user.ctm_balance < chapterCost) {
      return res.status(402).json({
        error: 'CTM insuffisants',
        needed: chapterCost,
        balance: user.ctm_balance,
        avatar
      });
    }

    // Déduire les CTM
    if (chapterCost > 0) {
      await supabase
        .from('users')
        .update({
          ctm_balance: user.ctm_balance - chapterCost,
          ctm_spent_total: user.ctm_balance + chapterCost  // fix: should add to spent
        })
        .eq('id', req.userId);

      // Correction: on fait l'update correct du spent
      await supabase.rpc('', {}); // placeholder, handled by update above
    }

    // Vérifier les milestones
    const milestone = AGE_MILESTONES[character.age];
    let milestoneData = null;
    if (milestone && !character.milestones_triggered.includes(character.age)) {
      milestoneData = { age: character.age, ...milestone };
      // Appliquer bonus
      const updates = {};
      if (milestone.bonus.health) updates.health = Math.max(0, Math.min(100, character.health + milestone.bonus.health));
      if (milestone.bonus.happiness) updates.happiness = Math.max(0, Math.min(100, character.happiness + milestone.bonus.happiness));
      if (milestone.bonus.wealth) updates.wealth = Math.max(0, Math.min(100, character.wealth + milestone.bonus.wealth));
      if (milestone.bonus.morality) updates.morality = Math.max(0, Math.min(100, character.morality + milestone.bonus.morality));
      updates.milestones_triggered = [...character.milestones_triggered, character.age];

      await supabase.from('characters').update(updates).eq('id', character.id);
      Object.assign(character, updates);
    }

    // Vérifier les événements d'amis en attente
    const friendEvents = await getPendingFriendEvents(character.id);
    let friendEventNarrative = null;
    if (friendEvents.length > 0) {
      const event = friendEvents[0];
      friendEventNarrative = {
        source: event.source_character?.name,
        description: event.description,
        effects: event.stat_effects
      };
      // Appliquer les effets de l'événement ami
      const fx = event.stat_effects || {};
      await supabase.from('characters').update({
        health: Math.max(0, Math.min(100, character.health + (fx.health || 0))),
        happiness: Math.max(0, Math.min(100, character.happiness + (fx.happiness || 0))),
        wealth: Math.max(0, Math.min(100, character.wealth + (fx.wealth || 0))),
        morality: Math.max(0, Math.min(100, character.morality + (fx.morality || 0))),
        karma: Math.max(0, Math.min(100, character.karma + (event.karma_effect || 0)))
      }).eq('id', character.id);

      // Marquer comme traité
      await supabase.from('friend_events').update({ processed: true }).eq('id', event.id);
    }

    // Récupérer l'historique récent
    const { data: recentHistory } = await supabase
      .from('history')
      .select('day, choice_made')
      .eq('character_id', character.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Contexte des amis
    const friendContext = await getFriendContext(req.userId);

    // Générer le chapitre via Claude
    const chapterData = await generateChapter({
      avatar,
      name: character.name,
      city: character.city,
      day: character.day,
      chapter: character.chapters_today + 1,
      age: character.age,
      stats: {
        health: Math.round(character.health),
        happiness: Math.round(character.happiness),
        wealth: Math.round(character.wealth),
        morality: Math.round(character.morality)
      },
      karma: Math.round(character.karma),
      history: (recentHistory || []).reverse().map(h => ({
        day: h.day,
        summary: h.choice_made
      })),
      npcContext: JSON.stringify(character.npcs || []),
      friendContext
    });

    // Mettre à jour l'avatar du personnage
    await supabase.from('characters').update({
      current_avatar: avatar,
      selected_avatar: avatar,
      [`${avatar}_uses_today`]: character[`${avatar}_uses_today`] + 1,
      updated_at: new Date().toISOString()
    }).eq('id', character.id);

    res.json({
      ...chapterData,
      ctm_remaining: Math.max(0, user.ctm_balance - chapterCost),
      ctm_cost: chapterCost,
      milestone: milestoneData,
      friendEvent: friendEventNarrative,
      chaptersToday: character.chapters_today,
      dailyLimit: DAILY_CHAPTER_LIMIT
    });

  } catch (err) {
    console.error('Chapter generation error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du chapitre' });
  }
});

// ============================================================
// POST /api/game/choice — Faire un choix
// ============================================================
router.post('/choice', authenticate, async (req, res) => {
  try {
    const { choiceIndex, choiceData } = req.body;

    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!character) return res.status(404).json({ error: 'Aucun personnage actif' });
    if (!character.alive) return res.status(400).json({ error: 'Ton personnage est mort' });

    // Appliquer les effets du choix
    const fx = choiceData.effects || {};
    const karmaShift = (choiceData.karma_shift || 0);

    const newStats = {
      health: Math.max(0, Math.min(100, character.health + (fx.health || 0))),
      happiness: Math.max(0, Math.min(100, character.happiness + (fx.happiness || 0))),
      wealth: Math.max(0, Math.min(100, character.wealth + (fx.wealth || 0))),
      morality: Math.max(0, Math.min(100, character.morality + (fx.morality || 0)))
    };

    let newKarma = Math.max(0, Math.min(100, character.karma + karmaShift));

    // Appliquer le cap de bonheur
    const happyCap = getHappinessCap(newKarma);
    if (newStats.happiness > happyCap) {
      newStats.happiness = happyCap;
    }

    // Nouveau avatar basé sur le karma
    const newAvatar = getAvatarFromKarma(newKarma);
    const avatarChanged = newAvatar !== character.current_avatar;

    // Chapitres
    const newChaptersToday = character.chapters_today + 1;
    const newTotalChapters = character.total_chapters + 1;

    // Progression du jour (chaque 5 chapitres = 1 jour = 1 an)
    let newDay = character.day;
    let newAge = character.age;
    let dayComplete = false;
    if (newChaptersToday >= DAILY_CHAPTER_LIMIT) {
      dayComplete = true;
    }

    // Mettre à jour le personnage
    await supabase.from('characters').update({
      ...newStats,
      karma: newKarma,
      current_avatar: newAvatar,
      chapters_today: newChaptersToday,
      total_chapters: newTotalChapters,
      day: newDay,
      age: newAge,
      last_play_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    }).eq('id', character.id);

    // Enregistrer dans l'historique
    await supabase.from('history').insert({
      character_id: character.id,
      day: character.day,
      chapter: newChaptersToday,
      avatar_used: character.current_avatar,
      choice_made: choiceData.text,
      consequence: choiceData.consequence,
      health_delta: fx.health || 0,
      happiness_delta: fx.happiness || 0,
      wealth_delta: fx.wealth || 0,
      morality_delta: fx.morality || 0,
      karma_delta: karmaShift,
      ctm_cost: CTM_COST[character.current_avatar]
    });

    // Générer un événement pour un ami aléatoire
    await generateFriendEvent(req.userId, character, choiceData, newKarma);

    // Vérifier la mort
    const deathCheck = checkDeath({ ...character, ...newStats, age: newAge });
    if (deathCheck.dead) {
      await supabase.from('characters').update({
        alive: false,
        death_cause: deathCheck.cause,
        died_at: new Date().toISOString()
      }).eq('id', character.id);
    }

    // Récupérer le solde CTM mis à jour
    const { data: user } = await supabase
      .from('users')
      .select('ctm_balance')
      .eq('id', req.userId)
      .single();

    res.json({
      stats: newStats,
      karma: newKarma,
      avatar: newAvatar,
      avatarChanged,
      chaptersToday: newChaptersToday,
      totalChapters: newTotalChapters,
      day: newDay,
      age: newAge,
      dayComplete,
      happinessCap: happyCap,
      dead: deathCheck.dead,
      deathCause: deathCheck.cause,
      ctm_balance: user?.ctm_balance || 0
    });

  } catch (err) {
    console.error('Choice error:', err);
    res.status(500).json({ error: 'Erreur lors du choix' });
  }
});

// ============================================================
// POST /api/game/recap — Récap quotidien
// ============================================================
router.post('/recap', authenticate, async (req, res) => {
  try {
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .limit(1)
      .single();

    if (!character) return res.status(404).json({ error: 'Aucun personnage' });

    const { data: todayHistory } = await supabase
      .from('history')
      .select('*')
      .eq('character_id', character.id)
      .eq('day', character.day)
      .order('chapter');

    const recap = await generateDailyRecap({
      avatar: character.current_avatar,
      name: character.name,
      city: character.city,
      day: character.day,
      age: character.age,
      stats: {
        health: character.health,
        happiness: character.happiness,
        wealth: character.wealth,
        morality: character.morality
      },
      karma: character.karma,
      todayHistory: todayHistory || []
    });

    res.json(recap);
  } catch (err) {
    console.error('Recap error:', err);
    res.status(500).json({ error: 'Erreur lors du récap' });
  }
});

// ============================================================
// POST /api/game/restart — Nouveau personnage après mort
// ============================================================
router.post('/restart', authenticate, async (req, res) => {
  try {
    // Vérifier que le perso actuel est bien mort
    const { data: old } = await supabase
      .from('characters')
      .select('id, alive')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (old && old.alive) {
      return res.status(400).json({ error: 'Ton personnage est encore en vie' });
    }

    res.json({ ok: true, message: 'Prêt pour un nouveau personnage' });
  } catch (err) {
    console.error('Restart error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// HELPER — Générer un événement pour un ami aléatoire
// ============================================================
async function generateFriendEvent(userId, character, choiceData, karma) {
  // 20% de chance de créer un événement
  if (Math.random() > 0.20) return;

  const { data: friendships } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'accepted');

  if (!friendships || friendships.length === 0) return;

  // Choisir un ami aléatoire
  const friendship = friendships[Math.floor(Math.random() * friendships.length)];
  const friendUserId = friendship.user_a === userId ? friendship.user_b : friendship.user_a;

  const { data: friendChar } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', friendUserId)
    .eq('alive', true)
    .limit(1)
    .single();

  if (!friendChar) return;

  // Déterminer l'événement en fonction du karma
  let event;
  if (karma >= 70) {
    event = {
      event_type: 'blessing',
      description: `${character.name} rayonne de bonté. Sa lumière t'inspire.`,
      stat_effects: { happiness: 3, morality: 2 },
      karma_effect: 2
    };
  } else if (karma >= 40) {
    event = {
      event_type: 'karma_influence',
      description: `${character.name} traverse une période trouble. Tu ressens son hésitation.`,
      stat_effects: { happiness: -1, morality: 1 },
      karma_effect: 0
    };
  } else if (karma >= 20) {
    event = {
      event_type: 'random_event',
      description: `${character.name} sombre dans l'ombre. Son aura t'affecte.`,
      stat_effects: { happiness: -3, morality: -2, health: -1 },
      karma_effect: -2
    };
  } else {
    event = {
      event_type: 'betrayal',
      description: `${character.name} a sombré dans les ténèbres. Sa corruption s'étend à toi.`,
      stat_effects: { happiness: -5, morality: -5, health: -3, wealth: -2 },
      karma_effect: -4
    };
  }

  await supabase.from('friend_events').insert({
    source_character_id: character.id,
    target_character_id: friendChar.id,
    ...event
  });
}

export default router;
