import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../services/supabase.js';

const router = Router();

// ============================================================
// GET /api/social/friends — Liste des amis
// ============================================================
router.get('/friends', authenticate, async (req, res) => {
  try {
    // Amitiés acceptées
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_a.eq.${req.userId},user_b.eq.${req.userId}`)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) {
      return res.json({ friends: [], pending: [] });
    }

    // Récupérer les infos des amis
    const friendIds = friendships.map(f =>
      f.user_a === req.userId ? f.user_b : f.user_a
    );

    const { data: friendUsers } = await supabase
      .from('users')
      .select('id, username')
      .in('id', friendIds);

    // Récupérer les personnages des amis
    const { data: friendChars } = await supabase
      .from('characters')
      .select('user_id, name, age, karma, current_avatar, health, happiness, wealth, morality, alive, weekly_score')
      .in('user_id', friendIds)
      .order('created_at', { ascending: false });

    // Combiner les données
    const friends = friendIds.map(fId => {
      const user = friendUsers?.find(u => u.id === fId);
      const char = friendChars?.find(c => c.user_id === fId);
      const friendship = friendships.find(f =>
        f.user_a === fId || f.user_b === fId
      );
      return {
        userId: fId,
        username: user?.username || '???',
        character: char || null,
        friendSince: friendship?.accepted_at
      };
    });

    // Demandes en attente (reçues)
    const { data: pending } = await supabase
      .from('friendships')
      .select('id, requested_by, created_at')
      .or(`user_a.eq.${req.userId},user_b.eq.${req.userId}`)
      .eq('status', 'pending')
      .neq('requested_by', req.userId);

    // Enrichir les demandes avec les usernames
    let pendingRequests = [];
    if (pending && pending.length > 0) {
      const pendingIds = pending.map(p => p.requested_by);
      const { data: pendingUsers } = await supabase
        .from('users')
        .select('id, username')
        .in('id', pendingIds);

      pendingRequests = pending.map(p => ({
        friendshipId: p.id,
        from: pendingUsers?.find(u => u.id === p.requested_by)?.username || '???',
        fromId: p.requested_by,
        date: p.created_at
      }));
    }

    res.json({ friends, pending: pendingRequests });
  } catch (err) {
    console.error('Friends list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/social/request — Envoyer une demande d'ami
// ============================================================
router.post('/request', authenticate, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Pseudo requis' });

    // Trouver l'utilisateur cible
    const { data: target } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username.trim())
      .single();

    if (!target) return res.status(404).json({ error: 'Joueur introuvable' });
    if (target.id === req.userId) return res.status(400).json({ error: 'Tu ne peux pas être ami avec toi-même' });

    // Vérifier qu'il n'y a pas déjà une relation
    const [idA, idB] = [req.userId, target.id].sort();
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .eq('user_a', idA)
      .eq('user_b', idB)
      .limit(1);

    if (existing && existing.length > 0) {
      const status = existing[0].status;
      if (status === 'accepted') return res.status(400).json({ error: 'Vous êtes déjà amis' });
      if (status === 'pending') return res.status(400).json({ error: 'Demande déjà envoyée' });
      if (status === 'blocked') return res.status(400).json({ error: 'Relation bloquée' });
    }

    // Créer la demande
    const { error } = await supabase.from('friendships').insert({
      user_a: idA,
      user_b: idB,
      requested_by: req.userId,
      status: 'pending'
    });

    if (error) throw error;

    // Bonus CTM pour invitation (première fois)
    const { data: inviteRewards } = await supabase
      .from('ctm_rewards')
      .select('id')
      .eq('user_id', req.userId)
      .eq('reason', 'invite_friend');

    // Max 5 bonus d'invitation
    if (!inviteRewards || inviteRewards.length < 5) {
      const bonus = 15;
      await supabase.from('users')
        .update({ ctm_balance: supabase.rpc ? undefined : undefined }) // Will use raw SQL
        .eq('id', req.userId);

      // Incrémenter directement
      const { data: user } = await supabase
        .from('users')
        .select('ctm_balance')
        .eq('id', req.userId)
        .single();

      await supabase.from('users').update({
        ctm_balance: user.ctm_balance + bonus
      }).eq('id', req.userId);

      await supabase.from('ctm_rewards').insert({
        user_id: req.userId,
        reason: 'invite_friend',
        amount: bonus
      });
    }

    res.json({ ok: true, message: `Demande envoyée à ${target.username}` });
  } catch (err) {
    console.error('Friend request error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/social/accept — Accepter une demande
// ============================================================
router.post('/accept', authenticate, async (req, res) => {
  try {
    const { friendshipId } = req.body;

    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('status', 'pending')
      .single();

    if (!friendship) return res.status(404).json({ error: 'Demande introuvable' });

    // Vérifier que c'est bien le destinataire qui accepte
    const isRecipient = (friendship.user_a === req.userId || friendship.user_b === req.userId)
      && friendship.requested_by !== req.userId;

    if (!isRecipient) return res.status(403).json({ error: 'Tu ne peux pas accepter ta propre demande' });

    await supabase.from('friendships').update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('id', friendshipId);

    res.json({ ok: true, message: 'Ami ajouté !' });
  } catch (err) {
    console.error('Accept error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/social/reject — Refuser une demande
// ============================================================
router.post('/reject', authenticate, async (req, res) => {
  try {
    const { friendshipId } = req.body;

    await supabase.from('friendships').update({
      status: 'rejected'
    }).eq('id', friendshipId);

    res.json({ ok: true });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/social/remove — Supprimer un ami
// ============================================================
router.post('/remove', authenticate, async (req, res) => {
  try {
    const { friendUserId } = req.body;
    const [idA, idB] = [req.userId, friendUserId].sort();

    await supabase.from('friendships')
      .delete()
      .eq('user_a', idA)
      .eq('user_b', idB);

    res.json({ ok: true, message: 'Ami supprimé' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/social/search/:username — Chercher un joueur
// ============================================================
router.get('/search/:username', authenticate, async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.length < 2) {
      return res.json({ results: [] });
    }

    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', `%${username}%`)
      .neq('id', req.userId)
      .limit(10);

    // Enrichir avec les persos
    const results = [];
    for (const u of (users || [])) {
      const { data: char } = await supabase
        .from('characters')
        .select('name, age, karma, current_avatar, alive')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      results.push({
        userId: u.id,
        username: u.username,
        character: char || null
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/social/events — Événements d'amis non lus
// ============================================================
router.get('/events', authenticate, async (req, res) => {
  try {
    const { data: character } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .limit(1)
      .single();

    if (!character) return res.json({ events: [] });

    const { data: events } = await supabase
      .from('friend_events')
      .select('*, source_character:source_character_id(name, current_avatar)')
      .eq('target_character_id', character.id)
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({ events: events || [] });
  } catch (err) {
    console.error('Events error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
