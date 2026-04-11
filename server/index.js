import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import shopRoutes, { handleStripeWebhook } from './routes/shop.js';
import socialRoutes from './routes/social.js';
import leaderboardRoutes from './routes/leaderboard.js';

import { updateWeeklyScores, closeWeeklyLeaderboard } from './cron/weekly.js';
import { processFriendConsequences } from './cron/friends.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

// Stripe webhook doit recevoir le body brut (avant express.json())
app.post('/api/shop/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// JSON parser pour toutes les autres routes
app.use(express.json());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Servir les fichiers statiques du frontend
app.use(express.static('../'));

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'alive',
    game: 'ANIMUS — L\'Influence Invisible',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// CRON JOBS
// ============================================================

// Mise à jour des scores hebdo — toutes les heures
cron.schedule('0 * * * *', () => {
  console.log('⏰ Cron: mise à jour des scores hebdo');
  updateWeeklyScores();
});

// Conséquences inter-joueurs — toutes les 6 heures
cron.schedule('0 */6 * * *', () => {
  console.log('⏰ Cron: conséquences amis');
  processFriendConsequences();
});

// Clôture hebdomadaire — chaque lundi à 00:00 UTC
cron.schedule('0 0 * * 1', () => {
  console.log('⏰ Cron: clôture du classement hebdomadaire');
  closeWeeklyLeaderboard();
});

// Reset du daily login — chaque jour à 00:00 UTC
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Cron: reset daily login');
  const { default: supabase } = await import('./services/supabase.js');
  await supabase.from('users').update({
    daily_login_claimed: false
  }).neq('id', '00000000-0000-0000-0000-000000000000'); // update all
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     ANIMUS — L'Influence Invisible      ║
║         Backend API v2.0.0              ║
║     http://localhost:${PORT}               ║
╚══════════════════════════════════════════╝

📡 Routes:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me
  POST /api/game/create
  GET  /api/game/state
  POST /api/game/chapter
  POST /api/game/choice
  POST /api/game/recap
  POST /api/game/restart
  GET  /api/shop/packs
  POST /api/shop/checkout
  POST /api/shop/webhook
  GET  /api/shop/balance
  POST /api/shop/claim-daily
  POST /api/shop/claim-share
  GET  /api/social/friends
  POST /api/social/request
  POST /api/social/accept
  POST /api/social/reject
  POST /api/social/remove
  GET  /api/social/search/:username
  GET  /api/social/events
  GET  /api/leaderboard/current
  GET  /api/leaderboard/history
  GET  /api/leaderboard/my-history

⏰ Crons:
  - Scores hebdo: toutes les heures
  - Conséquences amis: toutes les 6h
  - Classement: chaque lundi 00:00 UTC
  - Daily reset: chaque jour 00:00 UTC
  `);
});

export default app;
