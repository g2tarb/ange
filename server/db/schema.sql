-- ============================================================
-- ANIMUS — Schema Supabase (PostgreSQL)
-- ============================================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS — Comptes joueurs
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  ctm_balance INTEGER NOT NULL DEFAULT 25,  -- 25 CTM offerts au départ
  ctm_earned_total INTEGER NOT NULL DEFAULT 25,
  ctm_spent_total INTEGER NOT NULL DEFAULT 0,
  daily_login_claimed BOOLEAN NOT NULL DEFAULT false,
  daily_login_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- CHARACTERS — Personnages (1 actif par user)
-- ============================================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  age INTEGER NOT NULL DEFAULT 16,
  day INTEGER NOT NULL DEFAULT 1,
  chapters_today INTEGER NOT NULL DEFAULT 0,
  total_chapters INTEGER NOT NULL DEFAULT 0,
  last_play_date DATE,

  -- Stats 0-100
  health REAL NOT NULL DEFAULT 80,
  happiness REAL NOT NULL DEFAULT 75,
  wealth REAL NOT NULL DEFAULT 40,
  morality REAL NOT NULL DEFAULT 70,

  -- Karma 0-100
  karma REAL NOT NULL DEFAULT 75,

  -- Avatar actuel
  current_avatar TEXT NOT NULL DEFAULT 'angel'
    CHECK (current_avatar IN ('angel', 'neutral', 'fallen', 'devil')),
  selected_avatar TEXT NOT NULL DEFAULT 'angel'
    CHECK (selected_avatar IN ('angel', 'neutral', 'fallen', 'devil')),

  -- Utilisations quotidiennes par avatar
  angel_uses_today INTEGER NOT NULL DEFAULT 0,
  neutral_uses_today INTEGER NOT NULL DEFAULT 0,
  fallen_uses_today INTEGER NOT NULL DEFAULT 0,
  devil_uses_today INTEGER NOT NULL DEFAULT 0,

  -- État
  alive BOOLEAN NOT NULL DEFAULT true,
  death_cause TEXT,
  died_at TIMESTAMPTZ,

  -- Titres
  earned_titles TEXT[] DEFAULT '{}',
  current_title TEXT DEFAULT '',

  -- Milestones déjà déclenchés
  milestones_triggered INTEGER[] DEFAULT '{}',

  -- PNJ
  npcs JSONB DEFAULT '[]',

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Score hebdo (calculé par le cron)
  weekly_score REAL NOT NULL DEFAULT 0,
  best_weekly_rank INTEGER
);

CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_alive ON characters(alive);
CREATE INDEX idx_characters_weekly ON characters(weekly_score DESC);

-- ============================================================
-- HISTORY — Historique des chapitres
-- ============================================================
CREATE TABLE history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  avatar_used TEXT NOT NULL,
  narrative TEXT,
  choice_made TEXT,
  consequence TEXT,

  -- Changements de stats
  health_delta REAL DEFAULT 0,
  happiness_delta REAL DEFAULT 0,
  wealth_delta REAL DEFAULT 0,
  morality_delta REAL DEFAULT 0,
  karma_delta REAL DEFAULT 0,

  -- Impact d'un ami
  friend_impact_id UUID REFERENCES characters(id),
  friend_impact_desc TEXT,

  ctm_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_character ON history(character_id);
CREATE INDEX idx_history_day ON history(character_id, day);

-- ============================================================
-- FRIENDSHIPS — Relations entre joueurs
-- ============================================================
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  requested_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  CONSTRAINT no_self_friend CHECK (user_a != user_b),
  CONSTRAINT unique_friendship UNIQUE (user_a, user_b)
);

CREATE INDEX idx_friendships_users ON friendships(user_a, user_b);
CREATE INDEX idx_friendships_status ON friendships(status);

-- ============================================================
-- FRIEND_EVENTS — Conséquences inter-joueurs
-- ============================================================
CREATE TABLE friend_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  target_character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
    -- 'karma_influence', 'random_event', 'death_impact', 'betrayal', 'blessing'
  description TEXT,
  stat_effects JSONB DEFAULT '{}',
  karma_effect REAL DEFAULT 0,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_friend_events_target ON friend_events(target_character_id, processed);

-- ============================================================
-- TRANSACTIONS — Achats CTM via Stripe
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  pack_id TEXT NOT NULL,
  amount_eur INTEGER NOT NULL,  -- en centimes (100 = 1€)
  ctm_credited INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_stripe ON transactions(stripe_session_id);

-- ============================================================
-- LEADERBOARD — Classement hebdomadaire
-- ============================================================
CREATE TABLE leaderboard_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  character_id UUID NOT NULL REFERENCES characters(id),
  user_id UUID NOT NULL REFERENCES users(id),
  username TEXT NOT NULL,
  character_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score REAL NOT NULL,
  age INTEGER NOT NULL,
  karma REAL NOT NULL,
  avatar TEXT NOT NULL,
  ctm_reward INTEGER NOT NULL DEFAULT 0,
  title_reward TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_week ON leaderboard_history(week_start);
CREATE INDEX idx_leaderboard_rank ON leaderboard_history(week_start, rank);

-- ============================================================
-- CTM_REWARDS — Log des CTM gratuits gagnés
-- ============================================================
CREATE TABLE ctm_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
    -- 'daily_login', 'share_death', 'invite_friend', 'weekly_top5', 'onboarding'
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ctm_rewards_user ON ctm_rewards(user_id);

-- ============================================================
-- FUNCTIONS — Utilitaires
-- ============================================================

-- Fonction pour calculer le score de vie hebdo
CREATE OR REPLACE FUNCTION calculate_life_score(
  p_health REAL, p_happiness REAL, p_wealth REAL, p_morality REAL,
  p_karma REAL, p_age INTEGER, p_friend_count INTEGER, p_friends_killed INTEGER
) RETURNS REAL AS $$
BEGIN
  RETURN (p_health * 1.0)
       + (p_happiness * 1.5)
       + (p_wealth * 0.8)
       + (p_morality * 1.2)
       + (p_karma * 2.0)
       + (p_age * 3.0)
       + (p_friend_count * 10.0)
       - (p_friends_killed * 50.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour le daily reset
CREATE OR REPLACE FUNCTION daily_reset_character(p_character_id UUID) RETURNS void AS $$
BEGIN
  UPDATE characters
  SET chapters_today = 0,
      angel_uses_today = 0,
      neutral_uses_today = 0,
      fallen_uses_today = 0,
      devil_uses_today = 0,
      last_play_date = CURRENT_DATE,
      day = day + 1,
      age = age + 1,
      updated_at = NOW()
  WHERE id = p_character_id
    AND (last_play_date IS NULL OR last_play_date < CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Sécurité Supabase
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_events ENABLE ROW LEVEL SECURITY;

-- Note: Les politiques RLS seront gérées via le backend (service_role key)
-- donc pas de politiques restrictives ici. Le backend fait la vérification.
