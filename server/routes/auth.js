import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../services/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ============================================================
// POST /api/auth/register
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, pseudo et mot de passe requis' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mot de passe minimum 6 caractères' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Pseudo entre 3 et 20 caractères' });
    }

    // Vérifier unicité
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email ou pseudo déjà utilisé' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        username: username.trim(),
        password_hash,
        ctm_balance: 25  // Cadeau de bienvenue
      })
      .select('id, email, username, ctm_balance, created_at')
      .single();

    if (error) throw error;

    // Log du bonus d'inscription
    await supabase.from('ctm_rewards').insert({
      user_id: user.id,
      reason: 'onboarding',
      amount: 25
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// ============================================================
// POST /api/auth/login
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Daily login bonus
    const today = new Date().toISOString().split('T')[0];
    let dailyBonus = 0;
    if (user.daily_login_date !== today) {
      dailyBonus = 3;
      await supabase
        .from('users')
        .update({
          ctm_balance: user.ctm_balance + 3,
          daily_login_claimed: true,
          daily_login_date: today,
          last_login: new Date().toISOString()
        })
        .eq('id', user.id);

      await supabase.from('ctm_rewards').insert({
        user_id: user.id,
        reason: 'daily_login',
        amount: 3
      });
    } else {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        ctm_balance: user.ctm_balance + dailyBonus,
        created_at: user.created_at
      },
      dailyBonus
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur de connexion' });
  }
});

// ============================================================
// GET /api/auth/me — Profil courant
// ============================================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, ctm_balance, ctm_earned_total, ctm_spent_total, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    // Récupérer le personnage actif
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', req.userId)
      .eq('alive', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Compter les amis
    const { count: friendCount } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .or(`user_a.eq.${req.userId},user_b.eq.${req.userId}`)
      .eq('status', 'accepted');

    res.json({ user, character, friendCount: friendCount || 0 });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
