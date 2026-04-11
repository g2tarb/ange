import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth.js';
import supabase from '../services/supabase.js';

const router = Router();

// ============================================================
// PACKS CTM
// ============================================================
const CTM_PACKS = {
  spark: {
    id: 'spark',
    name: 'Étincelle',
    ctm: 25,
    price_eur: 100,      // en centimes
    display_price: '1€',
    description: '~2 chapitres Ange'
  },
  flame: {
    id: 'flame',
    name: 'Flamme',
    ctm: 80,
    price_eur: 299,
    display_price: '2,99€',
    description: '~6 chapitres Ange'
  },
  light: {
    id: 'light',
    name: 'Lumière',
    ctm: 150,
    price_eur: 499,
    display_price: '4,99€',
    description: '~12 chapitres Ange'
  },
  divine: {
    id: 'divine',
    name: 'Divin',
    ctm: 350,
    price_eur: 999,
    display_price: '9,99€',
    description: '~29 chapitres Ange'
  }
};

// ============================================================
// GET /api/shop/packs — Liste des packs
// ============================================================
router.get('/packs', authenticate, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('ctm_balance')
    .eq('id', req.userId)
    .single();

  res.json({
    packs: Object.values(CTM_PACKS),
    balance: user?.ctm_balance || 0,
    costs: { angel: 4, neutral: 3, fallen: 1, devil: 0 },
    decisionsPerChapter: 3
  });
});

// ============================================================
// POST /api/shop/checkout — Créer une session Stripe
// ============================================================
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { packId } = req.body;
    const pack = CTM_PACKS[packId];

    if (!pack) {
      return res.status(400).json({ error: 'Pack invalide' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const priceKey = `STRIPE_PRICE_${packId.toUpperCase()}`;
    const priceId = process.env[priceKey];

    let session;

    if (priceId && priceId !== 'price_xxx') {
      // Utiliser un prix Stripe pré-configuré
      session = await stripe.checkout.sessions.create({
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}?payment=success&pack=${packId}`,
        cancel_url: `${process.env.FRONTEND_URL}?payment=cancel`,
        metadata: {
          user_id: req.userId,
          pack_id: packId,
          ctm_amount: pack.ctm.toString()
        }
      });
    } else {
      // Créer un prix à la volée (mode dev)
      session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `ANIMUS — Pack ${pack.name}`,
              description: `${pack.ctm} CTM — ${pack.description}`
            },
            unit_amount: pack.price_eur
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}?payment=success&pack=${packId}`,
        cancel_url: `${process.env.FRONTEND_URL}?payment=cancel`,
        metadata: {
          user_id: req.userId,
          pack_id: packId,
          ctm_amount: pack.ctm.toString()
        }
      });
    }

    // Enregistrer la transaction en attente
    await supabase.from('transactions').insert({
      user_id: req.userId,
      stripe_session_id: session.id,
      pack_id: packId,
      amount_eur: pack.price_eur,
      ctm_credited: pack.ctm,
      status: 'pending'
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Erreur de paiement' });
  }
});

// ============================================================
// POST /api/shop/webhook — Webhook Stripe
// (Monté séparément dans index.js avec express.raw())
// ============================================================
export async function handleStripeWebhook(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: 'Signature invalide' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;
    const packId = session.metadata.pack_id;
    const ctmAmount = parseInt(session.metadata.ctm_amount);

    // Créditer les CTM
    const { data: user } = await supabase
      .from('users')
      .select('ctm_balance, ctm_earned_total')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          ctm_balance: user.ctm_balance + ctmAmount,
          ctm_earned_total: user.ctm_earned_total + ctmAmount
        })
        .eq('id', userId);
    }

    // Marquer la transaction comme complétée
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        stripe_payment_intent: session.payment_intent,
        completed_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id);

    console.log(`✅ CTM crédités: ${ctmAmount} CTM pour user ${userId} (pack ${packId})`);
  }

  res.json({ received: true });
}

// ============================================================
// GET /api/shop/balance — Solde CTM
// ============================================================
router.get('/balance', authenticate, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('ctm_balance, ctm_earned_total, ctm_spent_total')
    .eq('id', req.userId)
    .single();

  res.json({
    balance: user?.ctm_balance || 0,
    earned: user?.ctm_earned_total || 0,
    spent: user?.ctm_spent_total || 0
  });
});

// ============================================================
// POST /api/shop/claim-daily — Réclamer les CTM quotidiens
// ============================================================
router.post('/claim-daily', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: user } = await supabase
      .from('users')
      .select('ctm_balance, daily_login_date, daily_login_claimed')
      .eq('id', req.userId)
      .single();

    if (user.daily_login_date === today && user.daily_login_claimed) {
      return res.status(400).json({ error: 'Bonus déjà réclamé aujourd\'hui' });
    }

    const bonus = 3; // 3 CTM gratuits par jour

    await supabase.from('users').update({
      ctm_balance: user.ctm_balance + bonus,
      daily_login_claimed: true,
      daily_login_date: today
    }).eq('id', req.userId);

    await supabase.from('ctm_rewards').insert({
      user_id: req.userId,
      reason: 'daily_login',
      amount: bonus
    });

    res.json({ bonus, newBalance: user.ctm_balance + bonus });
  } catch (err) {
    console.error('Claim daily error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/shop/claim-share — CTM pour partage death card
// ============================================================
router.post('/claim-share', authenticate, async (req, res) => {
  try {
    // Vérifier qu'on n'a pas déjà réclamé aujourd'hui
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('ctm_rewards')
      .select('id')
      .eq('user_id', req.userId)
      .eq('reason', 'share_death')
      .gte('created_at', today)
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Bonus de partage déjà réclamé aujourd\'hui' });
    }

    const bonus = 5;
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
      reason: 'share_death',
      amount: bonus
    });

    res.json({ bonus, newBalance: user.ctm_balance + bonus });
  } catch (err) {
    console.error('Claim share error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { CTM_PACKS };
export default router;
