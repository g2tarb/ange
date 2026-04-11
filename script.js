/* ============================================================
   ANIMUS — L'Influence Invisible
   script.js — Backend API Edition
   ============================================================ */

'use strict';

// ============================================================
// API CONFIGURATION
// ============================================================
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// ============================================================
// AUTH TOKEN MANAGEMENT
// ============================================================
function getToken() {
  return localStorage.getItem('animus_token');
}

function setToken(token) {
  localStorage.setItem('animus_token', token);
}

function clearToken() {
  localStorage.removeItem('animus_token');
}

function isLoggedIn() {
  return !!getToken();
}

// ============================================================
// API HELPER
// ============================================================
async function api(path, options = {}) {
  const url = API_BASE + path;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);

  if (res.status === 401) {
    clearToken();
    showScreen('screen-auth');
    throw new Error('Session expiree. Reconnecte-toi.');
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || errBody.message || `Erreur ${res.status}`);
  }

  return res.json();
}

// ============================================================
// AVATAR CONFIG
// ============================================================
const AVATAR_CONFIG = {
  angel: {
    name: "L'Ange Heureux",
    tag: "GUIDE CELESTE",
    emoji: "\u{1F54A}\uFE0F",
    theme: "theme-angel",
    video: "avatar/angeHeureux.mp4",
    ctmCost: 4,
    loadingTexts: [
      "La lumiere divine murmure...",
      "Les ailes se deploient...",
      "La grace s'eveille...",
      "Un chant celeste resonne...",
      "La benediction descend..."
    ],
    whispers: [
      "Choisis la lumiere... elle ne deceoit jamais.",
      "Le bonheur est un chemin, pas une destination.",
      "Chaque acte de bonte est une priere silencieuse.",
      "La grace est dans le pardon, pas dans la vengeance.",
      "Tu es plus fort que tu ne le crois.",
      "L'amour est la seule force qui grandit quand on la partage.",
      "Ecoute ton coeur, il connait le chemin."
    ]
  },

  neutral: {
    name: "Le Neutre",
    tag: "OBSERVATEUR FROID",
    emoji: "\u2696\uFE0F",
    theme: "theme-neutral",
    video: "avatar/angeNeutre.mp4",
    ctmCost: 3,
    loadingTexts: [
      "Calcul des probabilites...",
      "Analyse des variables...",
      "Equilibrage des forces...",
      "Lecture des trajectoires...",
      "Ponderation des issues..."
    ],
    whispers: [
      "Les emotions sont des variables. Controle-les.",
      "La logique est le seul refuge contre le chaos.",
      "Observe. Analyse. Agis. Sans regret.",
      "L'equilibre parfait est l'absence de passion.",
      "Ni bien, ni mal. Seulement... efficace.",
      "Les sentiments sont des donnees, pas des directives.",
      "Chaque consequence a ete calculee."
    ]
  },

  fallen: {
    name: "L'Ange Dechu",
    tag: "AME BRISEE",
    emoji: "\u{1FA78}",
    theme: "theme-fallen",
    video: "avatar/angeDechu.mp4",
    ctmCost: 1,
    loadingTexts: [
      "Les cendres se levent...",
      "La chute s'accelere...",
      "L'ombre s'etend...",
      "Les ailes brulent doucement...",
      "Le sang murmure des verites..."
    ],
    whispers: [
      "La beaute est dans la brisure...",
      "Laisse-toi tomber. La chute est si douce.",
      "L'oubli a un gout de miel empoisonne.",
      "Personne ne te sauvera. C'est... liberateur.",
      "La ruine a ses propres cathedrales.",
      "Chaque cicatrice est un poeme que tu as ecrit.",
      "Le fond n'existe pas. On peut toujours descendre plus bas."
    ]
  },

  devil: {
    name: "Le Diable",
    tag: "PRINCE DES TENEBRES",
    emoji: "\u{1F525}",
    theme: "theme-devil",
    video: "avatar/diable.mp4",
    ctmCost: 0,
    loadingTexts: [
      "L'enfer se dechaine...",
      "Les flammes rugissent...",
      "La damnation approche...",
      "Le soufre emplit l'air...",
      "Les chaines se brisent..."
    ],
    whispers: [
      "Le pouvoir. C'est tout ce qui compte.",
      "Ils sont faibles. Toi, tu es un predateur.",
      "La pitie est une chaine. Brise-la.",
      "Le monde brulera, et tu seras le dernier debout.",
      "La violence est le langage le plus honnete.",
      "Prends ce que tu veux. Le remords est pour les faibles.",
      "Chaque empire a ete bati sur des os."
    ]
  }
};

const AVATAR_EMOJIS = {
  angel: "\u{1F54A}\uFE0F",
  neutral: "\u2696\uFE0F",
  fallen: "\u{1FA78}",
  devil: "\u{1F525}"
};

// ============================================================
// GAME STATE (from server — no localStorage)
// ============================================================
let gameState = null;       // Full state from GET /api/game/state
let ctmBalance = 0;         // CTM balance
let currentAvatar = 'angel'; // Currently selected avatar
let selectedAvatar = null;   // Avatar selected on intro screen
let prevStats = null;        // Previous stats for delta display
let dailyLimit = 5;          // Daily chapter limit
let friendCount = 0;         // Friend count from server

// ============================================================
// CTM COSTS
// ============================================================
const CTM_COSTS = { angel: 4, neutral: 3, fallen: 1, devil: 0 };
const DECISIONS_PER_CHAPTER = 3;

function getChapterCost(avatarKey) {
  return (CTM_COSTS[avatarKey] || 0) * DECISIONS_PER_CHAPTER;
}

// ============================================================
// AUDIO STATE
// ============================================================
let soundEnabled = true;
let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;

// ============================================================
// WEB AUDIO — AMBIENT & SFX
// ============================================================
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(audioCtx.destination);
}

function startAmbient(avatarKey) {
  if (!audioCtx || !soundEnabled) return;
  stopAmbient();

  const freqs = {
    angel:   [220, 330, 440],
    neutral: [180, 240, 300],
    fallen:  [110, 165, 220],
    devil:   [80, 120, 160]
  };

  const detunes = {
    angel: 0, neutral: 0, fallen: 5, devil: 15
  };

  const waveforms = {
    angel: 'sine', neutral: 'triangle', fallen: 'sine', devil: 'sawtooth'
  };

  const f = freqs[avatarKey] || freqs.angel;
  const d = detunes[avatarKey] || 0;
  const w = waveforms[avatarKey] || 'sine';

  ambientOsc = [];
  f.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = w;
    osc.frequency.value = freq;
    osc.detune.value = d * (i + 1);
    gain.gain.value = 0.012 / (i + 1);
    osc.connect(gain);
    gain.connect(ambientGain);
    osc.start();
    ambientOsc.push({ osc, gain });
  });

  ambientGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 3);
}

function stopAmbient() {
  if (ambientOsc) {
    ambientOsc.forEach(o => {
      try { o.osc.stop(); } catch(e) {}
    });
    ambientOsc = null;
  }
  if (ambientGain) {
    ambientGain.gain.value = 0;
  }
}

function playSFX(type) {
  if (!audioCtx || !soundEnabled) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch(type) {
    case 'select':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'choice':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'avatar_change':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.8);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
      osc.start(now);
      osc.stop(now + 1);
      break;

    case 'gameover':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.start(now);
      osc.stop(now + 2.5);
      break;

    case 'whisper':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'negative':
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.body.classList.toggle('sound-muted', !soundEnabled);

  if (!soundEnabled) {
    stopAmbient();
  } else if (currentAvatar) {
    initAudio();
    startAmbient(currentAvatar);
  }
}

// ============================================================
// ADVANCED PARTICLE SYSTEM
// ============================================================
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
let currentParticleTheme = 'angel';

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initParticles(theme) {
  currentParticleTheme = theme || currentParticleTheme;
  particles = [];
  const count = window.innerWidth < 768 ? 40 : 80;

  for (let i = 0; i < count; i++) {
    particles.push(createParticle(currentParticleTheme));
  }
}

function createParticle(theme) {
  const base = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    life: Math.random(),
    opacity: Math.random() * 0.6 + 0.1
  };

  switch(theme) {
    case 'angel':
      return {
        ...base,
        r: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: -Math.random() * 0.6 - 0.15,
        type: 'glow',
        pulse: Math.random() * Math.PI * 2
      };

    case 'neutral':
      return {
        ...base,
        r: Math.random() * 1 + 0.3,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.2,
        type: 'dot',
        angle: Math.random() * Math.PI * 2,
        orbitSpeed: (Math.random() - 0.5) * 0.005
      };

    case 'fallen':
      return {
        ...base,
        r: Math.random() * 1.5 + 0.3,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: Math.random() * 0.4 + 0.1,
        type: 'drop',
        trail: []
      };

    case 'devil':
      return {
        ...base,
        r: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: -Math.random() * 1 - 0.3,
        type: 'ember',
        flicker: Math.random() * Math.PI * 2
      };

    default:
      return {
        ...base,
        r: Math.random() * 1.5 + 0.3,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.5 - 0.1
      };
  }
}

function getThemeColor() {
  return getComputedStyle(document.body)
    .getPropertyValue('--particle-color').trim() || '#c9a227';
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return { r, g, b };
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const color = getThemeColor();
  const rgb = hexToRgb(color);
  const time = Date.now() * 0.001;

  particles.forEach((p, idx) => {
    p.life += 0.002;

    switch(p.type) {
      case 'glow':
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;
        const glowSize = p.r + Math.sin(p.pulse) * 0.5;

        if (p.y < -10 || p.life > 1) {
          Object.assign(p, createParticle('angel'));
          p.y = canvas.height + 10;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize * 3);
        grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * (1 - p.life) * 0.8})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - glowSize * 3, p.y - glowSize * 3, glowSize * 6, glowSize * 6);

        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * (1 - p.life)})`;
        ctx.fill();
        break;

      case 'dot':
        p.angle += p.orbitSpeed;
        p.x += Math.cos(p.angle) * 0.3 + p.speedX * 0.1;
        p.y += Math.sin(p.angle) * 0.2 + p.speedY * 0.1;

        if (p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10 || p.life > 1) {
          Object.assign(p, createParticle('neutral'));
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * (1 - p.life) * 0.6})`;
        ctx.fill();

        // Connect nearby neutral particles
        particles.forEach((p2, idx2) => {
          if (idx2 <= idx || p2.type !== 'dot') return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
        break;

      case 'drop':
        p.x += p.speedX + Math.sin(time + idx) * 0.1;
        p.y += p.speedY;
        p.speedY += 0.005;

        if (p.y > canvas.height + 10 || p.life > 1) {
          Object.assign(p, createParticle('fallen'));
          p.y = -10;
        }

        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r * 0.6, p.r * 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * (1 - p.life) * 0.7})`;
        ctx.fill();
        break;

      case 'ember':
        p.flicker += 0.1;
        p.x += p.speedX + Math.sin(p.flicker) * 0.3;
        p.y += p.speedY;
        p.speedY *= 0.998;

        if (p.y < -10 || p.life > 1) {
          Object.assign(p, createParticle('devil'));
          p.y = canvas.height + 10;
        }

        const emberOpacity = p.opacity * (1 - p.life) * (0.5 + Math.sin(p.flicker) * 0.5);
        const emberGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);
        emberGrad.addColorStop(0, `rgba(255,200,50,${emberOpacity})`);
        emberGrad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${emberOpacity * 0.5})`);
        emberGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = emberGrad;
        ctx.fillRect(p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4);
        break;

      default:
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -10 || p.life > 1) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.life = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * (1 - p.life)})`;
        ctx.fill();
    }
  });

  requestAnimationFrame(animateParticles);
}

// ============================================================
// THEME
// ============================================================
function applyTheme(avatarKey, flash = true) {
  const cfg = AVATAR_CONFIG[avatarKey];
  if (!cfg) return;

  if (flash) {
    const flashEl = document.getElementById('theme-flash');
    flashEl.classList.add('flash');
    setTimeout(() => flashEl.classList.remove('flash'), 400);
  }

  document.body.className = cfg.theme;
  if (!soundEnabled) document.body.classList.add('sound-muted');

  initParticles(avatarKey);

  if (soundEnabled) {
    initAudio();
    startAmbient(avatarKey);
  }
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
    s.style.opacity = '0';
  });

  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  requestAnimationFrame(() => {
    el.classList.add('active');
    el.style.opacity = '1';
  });

  // Show/hide HUD elements based on screen
  const inGame = (id === 'screen-game' || id === 'screen-shop' || id === 'screen-friends' || id === 'screen-leaderboard');
  const ctmHud = document.getElementById('ctm-hud');
  const navHud = document.getElementById('nav-hud');
  if (ctmHud) ctmHud.style.display = inGame ? '' : 'none';
  if (navHud) navHud.style.display = inGame ? '' : 'none';
}

// ============================================================
// SCREEN SHAKE
// ============================================================
function screenShake() {
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 500);
}

// ============================================================
// TYPEWRITER EFFECT
// ============================================================
let typewriterTimer = null;

function typewriterEffect(elementId, text, speed = 16) {
  const el = document.getElementById(elementId);
  el.textContent = '';
  el.classList.add('loading');

  if (typewriterTimer) clearInterval(typewriterTimer);

  let i = 0;
  typewriterTimer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
      el.classList.remove('loading');
    }
  }, speed);
}

// ============================================================
// LOADING OVERLAY
// ============================================================
function setLoading(active, text = '') {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.toggle('active', active);
  if (text) document.getElementById('loading-text').textContent = text;
}

// ============================================================
// NOTIFICATION
// ============================================================
function showNotif(msg, duration = 3500) {
  const notif = document.getElementById('notif');
  const textEl = document.getElementById('notif-text');
  textEl.textContent = msg;
  notif.classList.add('show');
  setTimeout(() => notif.classList.remove('show'), duration);
}

// ============================================================
// CTM HUD
// ============================================================
function updateCTMDisplay() {
  const amountEl = document.getElementById('ctm-amount');
  const inlineEl = document.getElementById('ctm-inline-val');
  if (amountEl) amountEl.textContent = ctmBalance;
  if (inlineEl) inlineEl.textContent = ctmBalance;
}

// ============================================================
// AUTH SYSTEM
// ============================================================
function showAuthForm(form) {
  if (form === 'register') {
    document.getElementById('auth-login').style.display = 'none';
    document.getElementById('auth-register').style.display = 'block';
  } else {
    document.getElementById('auth-login').style.display = 'block';
    document.getElementById('auth-register').style.display = 'none';
  }
  // Clear errors
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').textContent = '';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Remplis tous les champs.';
    return;
  }

  setLoading(true, 'Connexion...');

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    setToken(data.token);
    setLoading(false);

    // Show daily bonus if applicable
    if (data.dailyBonus && data.dailyBonus > 0) {
      showDailyBonus(data.dailyBonus);
    }

    playSFX('select');
    await initGameAfterAuth();

  } catch (e) {
    setLoading(false);
    errorEl.textContent = e.message;
  }
}

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('register-error');
  errorEl.textContent = '';

  if (!username || !email || !password) {
    errorEl.textContent = 'Remplis tous les champs.';
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = 'Le mot de passe doit faire au moins 6 caracteres.';
    return;
  }

  if (username.length < 3 || username.length > 20) {
    errorEl.textContent = 'Le pseudo doit faire entre 3 et 20 caracteres.';
    return;
  }

  setLoading(true, 'Creation du compte...');

  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: { email, username, password }
    });

    setToken(data.token);
    setLoading(false);
    playSFX('choice');
    showNotif('Compte cree ! 25 CTM offerts.');

    // New player: show tutorial
    showScreen('screen-tutorial');

  } catch (e) {
    setLoading(false);
    errorEl.textContent = e.message;
  }
}

function logout() {
  clearToken();
  gameState = null;
  ctmBalance = 0;
  currentAvatar = 'angel';
  selectedAvatar = null;
  prevStats = null;
  stopAmbient();
  showNotif('Deconnecte.');
  showScreen('screen-auth');
}

// ============================================================
// INIT GAME AFTER AUTH
// ============================================================
async function initGameAfterAuth() {
  try {
    const me = await api('/api/auth/me');
    friendCount = me.friendCount || 0;

    if (me.character && me.character.name) {
      // Player has a character — load game state
      await loadGameState();

      if (gameState && gameState.character) {
        // Existing game — go to game screen
        currentAvatar = gameState.character.current_avatar || 'angel';
        prevStats = gameState.character.stats ? { ...gameState.character.stats } : null;

        showScreen('screen-game');
        applyTheme(currentAvatar, true);
        updateAvatarSwitcher();
        updateGameUI();

        if (gameState.chaptersToday < dailyLimit) {
          generateChapter();
        }

        setTimeout(() => showWhisper(), 2000);
      }
    } else {
      // New character needed — show character creation
      showScreen('screen-character');
    }

  } catch (e) {
    console.error('Init error:', e);
    showNotif('Erreur de chargement. ' + e.message);
    showScreen('screen-auth');
  }
}

// ============================================================
// LOAD GAME STATE FROM SERVER
// ============================================================
async function loadGameState() {
  try {
    const data = await api('/api/game/state');
    gameState = data;
    ctmBalance = data.ctm || 0;
    dailyLimit = data.dailyLimit || 5;
    friendCount = data.friendCount || 0;

    // Update server-provided CTM costs if available
    if (data.ctmCosts) {
      Object.keys(data.ctmCosts).forEach(k => {
        if (CTM_COSTS.hasOwnProperty(k)) {
          CTM_COSTS[k] = data.ctmCosts[k];
        }
      });
    }

    updateCTMDisplay();
    return data;
  } catch (e) {
    console.error('loadGameState error:', e);
    throw e;
  }
}

// ============================================================
// CINEMATIC INTRO
// ============================================================
let cinematicDone = false;

function skipCinematic() {
  if (cinematicDone) return;
  cinematicDone = true;

  initAudio();
  playSFX('select');
  applyTheme('angel', false);

  // Check if logged in
  if (isLoggedIn()) {
    setLoading(true, 'Chargement...');
    initGameAfterAuth().finally(() => setLoading(false));
  } else {
    showScreen('screen-auth');
  }
}

// Auto-skip cinematic after full animation
setTimeout(() => {
  const skipEl = document.getElementById('cine-skip');
  if (skipEl) {
    skipEl.style.cursor = 'pointer';
  }
}, 8000);

// ============================================================
// TUTORIAL
// ============================================================
let currentSlide = 0;
const TOTAL_SLIDES = 4; // Updated for 4 slides (concept, CTM, social, leaderboard)

function goToSlide(n) {
  currentSlide = n;
  document.querySelectorAll('.tuto-slide').forEach((s, i) => {
    s.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.tuto-dot').forEach((d, i) => {
    d.classList.toggle('active', i === n);
  });
  document.getElementById('tuto-prev').style.visibility = n === 0 ? 'hidden' : 'visible';
  document.getElementById('tuto-next').textContent = n === (TOTAL_SLIDES - 1) ? 'Commencer' : 'Suivant';
}

function nextSlide() {
  if (currentSlide >= TOTAL_SLIDES - 1) {
    showScreen('screen-character');
    return;
  }
  goToSlide(currentSlide + 1);
}

function prevSlide() {
  if (currentSlide > 0) goToSlide(currentSlide - 1);
}

// ============================================================
// CHARACTER CREATION
// ============================================================
async function confirmCharacter() {
  const nameInput = document.getElementById('input-name');
  const cityInput = document.getElementById('input-city');

  const name = nameInput.value.trim();
  const city = cityInput.value.trim();

  if (!name) {
    nameInput.style.borderColor = '#ff4040';
    nameInput.focus();
    showNotif('Entre ton nom pour commencer.');
    return;
  }
  if (!city) {
    cityInput.style.borderColor = '#ff4040';
    cityInput.focus();
    showNotif('Dis-nous ou tu vis.');
    return;
  }

  playSFX('choice');
  setLoading(true, 'Creation du personnage...');

  try {
    const data = await api('/api/game/create', {
      method: 'POST',
      body: { name, city }
    });

    setLoading(false);
    showNotif('Personnage cree !');
    showScreen('screen-intro');

  } catch (e) {
    setLoading(false);
    showNotif('Erreur: ' + e.message);
  }
}

// ============================================================
// RESUME GAME (from character screen)
// ============================================================
async function resumeGame() {
  initAudio();
  playSFX('choice');
  setLoading(true, 'Chargement de la partie...');

  try {
    await loadGameState();

    if (!gameState || !gameState.character) {
      setLoading(false);
      showNotif('Aucune partie trouvee.');
      return;
    }

    currentAvatar = gameState.character.current_avatar || 'angel';
    prevStats = gameState.character.stats ? { ...gameState.character.stats } : null;

    setLoading(false);
    showScreen('screen-game');
    applyTheme(currentAvatar, true);
    updateAvatarSwitcher();
    updateGameUI();

    if (gameState.chaptersToday < dailyLimit) {
      generateChapter();
    }

    setTimeout(() => showWhisper(), 2000);

  } catch (e) {
    setLoading(false);
    showNotif('Erreur: ' + e.message);
  }
}

// Show save resume panel
async function showSaveResume() {
  try {
    const me = await api('/api/auth/me');
    if (!me.character || !me.character.name) return;

    const el = document.getElementById('save-resume');
    el.style.display = 'block';

    const c = me.character;
    document.getElementById('save-name').textContent = c.name || '???';
    document.getElementById('save-age').textContent = (c.age || 16) + ' ans';
    document.getElementById('save-city').textContent = c.city || '???';

    const stats = c.stats || { health: 80, happiness: 75, wealth: 40, morality: 70 };
    document.getElementById('save-stats-preview').textContent =
      `\u2665 ${Math.round(stats.health)} \u00B7 \u2605 ${Math.round(stats.happiness)} \u00B7 \u25C6 ${Math.round(stats.wealth)} \u00B7 \u263D ${Math.round(stats.morality)}`;
    document.getElementById('save-day-preview').textContent =
      `Jour ${c.day || 1} \u00B7 ${c.total_chapters || 0} chapitres`;

  } catch (e) {
    // No saved game, no big deal
  }
}

// ============================================================
// AVATAR SELECTION (intro screen)
// ============================================================
function selectAvatar(avatar) {
  selectedAvatar = avatar;

  initAudio();
  playSFX('select');

  document.querySelectorAll('.avatar-card').forEach(c => {
    const isSelected = c.dataset.avatar === avatar;
    c.classList.toggle('selected', isSelected);
    c.style.opacity = isSelected ? '1' : '0.35';
  });

  document.getElementById('btn-start').classList.add('visible');
  applyTheme(avatar, false);
}

// ============================================================
// MOUSE PARALLAX (intro screen)
// ============================================================
document.addEventListener('mousemove', (e) => {
  const grid = document.getElementById('avatar-grid');
  if (!grid || !document.getElementById('screen-intro').classList.contains('active')) return;

  const x = (e.clientX / window.innerWidth - 0.5) * 8;
  const y = (e.clientY / window.innerHeight - 0.5) * 5;

  grid.style.transform = `perspective(1000px) rotateX(${-y * 0.3}deg) rotateY(${x * 0.3}deg)`;
});

// ============================================================
// START GAME
// ============================================================
async function startGame() {
  if (!selectedAvatar) return;

  initAudio();
  playSFX('choice');

  // Check CTM balance
  const chapterCost = getChapterCost(selectedAvatar);
  if (chapterCost > 0) {
    // Fetch current balance
    try {
      const balData = await api('/api/shop/balance');
      ctmBalance = balData.balance || 0;
      updateCTMDisplay();
    } catch (e) {
      // Will be checked server-side anyway
    }

    if (ctmBalance < chapterCost) {
      showCTMWarning(selectedAvatar);
      return;
    }
  }

  setLoading(true, 'Chargement...');

  try {
    await loadGameState();

    currentAvatar = selectedAvatar;
    prevStats = gameState && gameState.character && gameState.character.stats
      ? { ...gameState.character.stats }
      : null;

    setLoading(false);
    showScreen('screen-game');
    applyTheme(currentAvatar, true);
    updateAvatarSwitcher();
    updateGameUI();
    generateChapter();

    setTimeout(() => showWhisper(), 2000);

  } catch (e) {
    setLoading(false);
    showNotif('Erreur: ' + e.message);
  }
}

// ============================================================
// CTM WARNING
// ============================================================
function showCTMWarning(avatarKey) {
  const warning = document.getElementById('ctm-warning');
  if (warning) {
    warning.style.display = 'block';
  }
  const choicesGrid = document.getElementById('choices-grid');
  if (choicesGrid) choicesGrid.style.display = 'none';
}

function hideCTMWarning() {
  const warning = document.getElementById('ctm-warning');
  if (warning) warning.style.display = 'none';
  const choicesGrid = document.getElementById('choices-grid');
  if (choicesGrid) choicesGrid.style.display = 'flex';
}

// ============================================================
// AVATAR SWITCHER (in-game)
// ============================================================
async function switchAvatar(avatarKey) {
  if (avatarKey === currentAvatar) return;

  // Check CTM for the new avatar
  const chapterCost = getChapterCost(avatarKey);
  if (chapterCost > 0 && ctmBalance < chapterCost) {
    showNotif(`${AVATAR_CONFIG[avatarKey].emoji} CTM insuffisants (${ctmBalance}/${chapterCost} CTM). Achete des CTM ou joue Diable.`);
    return;
  }

  initAudio();
  playSFX('avatar_change');
  screenShake();

  const cfg = AVATAR_CONFIG[avatarKey];
  currentAvatar = avatarKey;

  showNotif(`${cfg.emoji} ${cfg.name} prend le controle...`);
  applyTheme(avatarKey, true);
  hideCTMWarning();
  updateAvatarSwitcher();
  updateGameUI();
  showWhisper();
}

function updateAvatarSwitcher() {
  document.querySelectorAll('.switch-btn').forEach(btn => {
    const av = btn.dataset.av;
    const isActive = av === currentAvatar;
    const cost = getChapterCost(av);
    const canAfford = ctmBalance >= cost || cost === 0;

    btn.classList.toggle('active', isActive);
    btn.classList.toggle('exhausted', !canAfford);
    btn.disabled = !canAfford && !isActive;

    // Update or create badge
    let badge = btn.querySelector('.switch-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'switch-badge';
      btn.appendChild(badge);
    }
    badge.textContent = CTM_COSTS[av];
    badge.classList.toggle('empty', !canAfford);
  });
}

// ============================================================
// AVATAR WHISPER SYSTEM
// ============================================================
let whisperTimeout = null;

function showWhisper(customText) {
  const cfg = AVATAR_CONFIG[currentAvatar];
  if (!cfg) return;
  const text = customText || cfg.whispers[Math.floor(Math.random() * cfg.whispers.length)];
  const el = document.getElementById('avatar-whisper');

  el.textContent = `"${text}"`;
  el.classList.add('visible');
  playSFX('whisper');

  clearTimeout(whisperTimeout);
  whisperTimeout = setTimeout(() => {
    el.classList.remove('visible');
  }, 4000);
}

// ============================================================
// UPDATE GAME UI
// ============================================================
function updateGameUI(showDeltas = false) {
  if (!gameState || !gameState.character) return;

  const c = gameState.character;
  const av = currentAvatar;
  const cfg = AVATAR_CONFIG[av];
  if (!cfg) return;

  const stats = c.stats || { health: 80, happiness: 75, wealth: 40, morality: 70 };
  const karma = c.karma != null ? c.karma : 0.75;
  const day = c.day || 1;
  const age = c.age || 16;
  const chaptersToday = gameState.chaptersToday || 0;
  const totalChapters = c.total_chapters || 0;

  // Character identity bar
  const ciName = document.getElementById('ci-name');
  const ciAge  = document.getElementById('ci-age');
  const ciCity = document.getElementById('ci-city');
  if (ciName) ciName.textContent = c.name || '???';
  if (ciAge)  ciAge.textContent  = age + ' ans';
  if (ciCity) ciCity.textContent = c.city || '???';

  // Title
  const ciTitle = document.getElementById('ci-title');
  if (ciTitle) ciTitle.textContent = c.current_title || '';

  // Avatar panel
  document.getElementById('avatar-display-name').textContent = cfg.name;
  document.getElementById('avatar-display-tag').textContent  = cfg.tag;
  document.getElementById('game-avatar-placeholder').textContent = cfg.emoji;

  // Avatar cost tag
  const costTag = document.getElementById('avatar-cost-tag');
  if (costTag) {
    costTag.textContent = cfg.ctmCost > 0 ? cfg.ctmCost + ' CTM/decision' : 'GRATUIT';
  }

  // Video
  const vid = document.getElementById('game-avatar-video');
  const fullVideoPath = new URL(cfg.video, window.location.href).href;
  if (vid.src !== fullVideoPath) {
    vid.src = cfg.video;
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.onerror = () => { vid.style.display = 'none'; };
    vid.onended = () => { vid.currentTime = 0; vid.play().catch(() => {}); };
    vid.play().catch(() => {});
  }

  // Stats bars with deltas
  ['health', 'happiness', 'wealth', 'morality'].forEach(k => {
    const val = Math.max(0, Math.min(100, stats[k] || 0));
    const bar = document.getElementById(`stat-${k}`);
    const valEl = document.getElementById(`stat-${k}-val`);
    const deltaEl = document.getElementById(`stat-${k}-delta`);
    const row = bar ? bar.closest('.stat-row') : null;

    if (bar) bar.style.width = val + '%';
    if (valEl) valEl.textContent = Math.round(val);

    // Critical state
    if (row) row.classList.toggle('critical', val <= 20);

    // Color bar based on value
    if (bar) {
      if (val <= 20) {
        bar.style.background = 'linear-gradient(90deg, #ff2020, #ff4040)';
      } else if (val <= 40) {
        bar.style.background = 'linear-gradient(90deg, #ff8040, #ffaa60)';
      } else {
        bar.style.background = '';
      }
    }

    // Show stat deltas
    if (showDeltas && prevStats && deltaEl) {
      const diff = Math.round(val - (prevStats[k] || 0));
      if (diff !== 0) {
        deltaEl.textContent = diff > 0 ? `+${diff}` : `${diff}`;
        deltaEl.className = `stat-delta ${diff > 0 ? 'positive' : 'negative'}`;
        deltaEl.style.animation = 'none';
        deltaEl.offsetHeight;
        deltaEl.style.animation = '';
      }
    }
  });

  // Happiness cap
  const capEl = document.getElementById('stat-happiness-cap');
  const lockEl = document.getElementById('stat-happiness-lock');
  const happinessCap = c.happiness_cap || 100;
  if (happinessCap < 100) {
    if (capEl) {
      capEl.classList.add('visible');
      capEl.style.left = happinessCap + '%';
    }
    if (lockEl) {
      lockEl.classList.add('visible');
      lockEl.title = `Bonheur plafonne a ${happinessCap}% (karma trop bas)`;
    }
  } else {
    if (capEl) capEl.classList.remove('visible');
    if (lockEl) lockEl.classList.remove('visible');
  }

  // Karma cursor
  const karmaCursor = document.getElementById('karma-cursor');
  if (karmaCursor) karmaCursor.style.left = (karma * 100) + '%';

  // Karma avatars — highlight current
  document.querySelectorAll('.karma-avatar-icon').forEach(icon => {
    icon.classList.toggle('active', icon.dataset.k === av);
  });

  // Day / chapter counter
  const dayDisp = document.getElementById('day-display');
  const chapDisp = document.getElementById('chapter-display');
  if (dayDisp) dayDisp.textContent = day;
  if (chapDisp) chapDisp.textContent = chaptersToday + '/' + dailyLimit;

  const remaining = dailyLimit - chaptersToday;
  const remLabel = document.getElementById('choices-remaining-label');
  if (remLabel) {
    remLabel.textContent = remaining > 0
      ? `${remaining} chapitre${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`
      : 'Termine pour aujourd\'hui';
  }

  // Daily limit
  const limitMsg    = document.getElementById('daily-limit-msg');
  const choicesGrid = document.getElementById('choices-grid');
  if (chaptersToday >= dailyLimit) {
    if (limitMsg) limitMsg.style.display = 'block';
    if (choicesGrid) choicesGrid.style.display = 'none';
  } else {
    if (limitMsg) limitMsg.style.display = 'none';
    if (choicesGrid) choicesGrid.style.display = 'flex';
  }

  // CTM display
  updateCTMDisplay();

  // History log
  const log = document.getElementById('history-log');
  const history = gameState.history || [];
  if (log) {
    log.innerHTML = history.slice(-12).reverse().map(h => {
      const emoji = AVATAR_EMOJIS[h.avatar] || '';
      return `<div class="history-entry">
        <span class="av-icon">${emoji}</span>
        <span class="day-tag">J.${h.day}</span>
        ${h.summary || h.text || ''}
      </div>`;
    }).join('');
  }
}

// ============================================================
// GENERATE CHAPTER VIA API
// ============================================================
async function generateChapter() {
  const chaptersToday = (gameState && gameState.chaptersToday) || 0;

  if (chaptersToday >= dailyLimit) {
    generateDailyRecap();
    return;
  }

  // Check CTM before generating
  const chapterCost = getChapterCost(currentAvatar);
  if (chapterCost > 0 && ctmBalance < chapterCost) {
    showCTMWarning(currentAvatar);
    return;
  }

  hideCTMWarning();

  const cfg = AVATAR_CONFIG[currentAvatar];
  const randomLoading = cfg.loadingTexts[Math.floor(Math.random() * cfg.loadingTexts.length)];

  setLoading(true, randomLoading);
  const chapterEl = document.getElementById('chapter-text');
  chapterEl.classList.add('loading');
  chapterEl.textContent = '';

  try {
    const data = await api('/api/game/chapter', {
      method: 'POST',
      body: { avatar: currentAvatar }
    });

    setLoading(false);
    chapterEl.classList.remove('loading');

    // Update CTM balance from response
    if (data.ctm_remaining != null) {
      ctmBalance = data.ctm_remaining;
      updateCTMDisplay();
      updateAvatarSwitcher();
    }

    // Display chapter title
    const title = data.chapter_title || `Chapitre ${chaptersToday + 1}`;
    document.getElementById('chapter-header').textContent = `\u2014 ${title} \u2014`;

    // Display narrative
    typewriterEffect('chapter-text', data.narrative || '');

    // Server whisper
    if (data.whisper) {
      setTimeout(() => showWhisper(data.whisper), 1500);
    }

    // Milestone from server
    if (data.milestone) {
      showMilestone(data.milestone);
    }

    // Friend event from server
    if (data.friendEvent) {
      showFriendEvent(data.friendEvent);
    }

    // Render choices
    renderChoices(data.choices || []);

  } catch (e) {
    console.error('Chapter error:', e);
    setLoading(false);
    chapterEl.classList.remove('loading');
    chapterEl.textContent = "Les fils du destin sont brouilles... La connexion est rompue.";

    // Fallback choices
    renderChoices([
      { text: "Continuer malgre tout", emoji: "\u{1F4AA}", tag: "courage" },
      { text: "Attendre un signe",     emoji: "\u{1F54A}", tag: "patience" },
      { text: "Se replier sur soi",    emoji: "\u{1F311}", tag: "solitude" }
    ]);
  }
}

// ============================================================
// DAILY RECAP
// ============================================================
async function generateDailyRecap() {
  setLoading(true, 'L\'histoire du jour s\'ecrit...');

  try {
    const data = await api('/api/game/recap', {
      method: 'POST'
    });

    setLoading(false);

    // Display long recap
    const recapEl = document.getElementById('daily-limit-msg');
    const choicesGrid = document.getElementById('choices-grid');
    if (choicesGrid) choicesGrid.style.display = 'none';
    if (recapEl) {
      recapEl.style.display = 'block';

      const narrative = data.narrative || 'La journee touche a sa fin...';
      recapEl.innerHTML = `
        <div class="recap-header">${data.chapter_title || 'Chronique du Jour'}</div>
        <div class="recap-text">${narrative}</div>
        <div class="recap-footer">
          <div class="limit-icon">&#127769;</div>
          <p>Reviens demain pour continuer ton destin.</p>
          <p class="recap-limits">Ange: 4 CTM &middot; Neutre: 3 CTM &middot; Dechu: 1 CTM &middot; Diable: GRATUIT</p>
        </div>
      `;
    }

    if (data.whisper) showWhisper(data.whisper);

  } catch(e) {
    console.error('Recap error:', e);
    setLoading(false);

    const recapEl = document.getElementById('daily-limit-msg');
    const choicesGrid = document.getElementById('choices-grid');
    if (choicesGrid) choicesGrid.style.display = 'none';
    if (recapEl) {
      recapEl.style.display = 'block';
      recapEl.innerHTML = `
        <div class="limit-icon">&#127769;</div>
        <h3>La nuit est tombee</h3>
        <p>Tu as vecu tes chapitres du jour.<br>Reviens demain pour continuer ton destin.</p>
        <p class="recap-limits">Ange: 4 CTM &middot; Neutre: 3 CTM &middot; Dechu: 1 CTM &middot; Diable: GRATUIT</p>
      `;
    }
  }

  updateGameUI();
}

// ============================================================
// RENDER CHOICES
// ============================================================
function renderChoices(choices) {
  const grid = document.getElementById('choices-grid');
  if (!grid) return;
  grid.innerHTML = '';

  choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.style.animationDelay = `${0.1 + i * 0.15}s`;
    const emoji = c.emoji ? `<span class="choice-emoji">${c.emoji}</span> ` : '';
    const tag = c.tag || c.hint || '';
    btn.innerHTML = `${emoji}${c.text}<span class="choice-karma-hint">${tag}</span>`;
    btn.addEventListener('click', () => makeChoice(i, c));
    grid.appendChild(btn);
  });
}

// ============================================================
// MAKE A CHOICE
// ============================================================
async function makeChoice(choiceIndex, choiceData) {
  const chaptersToday = (gameState && gameState.chaptersToday) || 0;
  if (chaptersToday >= dailyLimit) return;

  initAudio();
  playSFX('choice');

  // Lock all buttons
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  // Save previous stats for delta display
  if (gameState && gameState.character && gameState.character.stats) {
    prevStats = { ...gameState.character.stats };
  }

  try {
    const result = await api('/api/game/choice', {
      method: 'POST',
      body: { choiceIndex, choiceData }
    });

    // Update local state from server response
    if (gameState && gameState.character) {
      if (result.stats) gameState.character.stats = result.stats;
      if (result.karma != null) gameState.character.karma = result.karma;
    }
    if (result.ctm_balance != null) {
      ctmBalance = result.ctm_balance;
      updateCTMDisplay();
    }
    if (result.chaptersToday != null) {
      gameState.chaptersToday = result.chaptersToday;
    }

    // Avatar change from karma shift
    if (result.avatarChanged && result.avatar) {
      const newAvatar = result.avatar;
      const cfg2 = AVATAR_CONFIG[newAvatar];
      if (cfg2) {
        currentAvatar = newAvatar;
        playSFX('avatar_change');
        screenShake();
        showNotif(`${cfg2.emoji} ${cfg2.name} prend le controle...`);
        setTimeout(() => {
          applyTheme(newAvatar, true);
          updateAvatarSwitcher();
          showWhisper();
        }, 600);
      }
    }

    // Negative SFX
    if (result.karma != null && prevStats && result.stats) {
      const karmaDropped = (result.karma < (gameState.character.karma || 0.5));
      if (karmaDropped) {
        playSFX('negative');
        screenShake();
      }
    }

    // Death check
    if (result.dead) {
      setTimeout(() => triggerGameOver(result.deathCause), 1500);
      return;
    }

    updateGameUI(true);
    updateAvatarSwitcher();

    const newChaptersToday = result.chaptersToday || (gameState ? gameState.chaptersToday : 0);

    if (newChaptersToday < dailyLimit) {
      setTimeout(() => showWhisper(), 1200);
      setTimeout(generateChapter, 1600);
    } else {
      setTimeout(generateDailyRecap, 800);
    }

  } catch (e) {
    console.error('Choice error:', e);
    showNotif('Erreur: ' + e.message);
    // Re-enable buttons so the player can try again
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = false);
  }
}

// ============================================================
// MILESTONE DISPLAY
// ============================================================
function showMilestone(milestone) {
  document.getElementById('milestone-age').textContent = (milestone.age || '') + ' ans';
  document.getElementById('milestone-title').textContent = milestone.title || '';
  document.getElementById('milestone-text').textContent = milestone.text || '';
  document.getElementById('milestone-overlay').classList.add('active');
  playSFX('select');
}

function closeMilestone() {
  document.getElementById('milestone-overlay').classList.remove('active');
}

// ============================================================
// FRIEND EVENT IN GAME
// ============================================================
function showFriendEvent(event) {
  const alert = document.getElementById('friend-event-alert');
  const text = document.getElementById('friend-event-text');
  if (!alert || !text) return;

  text.textContent = event.text || event.message || 'Un ami a influence ta vie...';
  alert.style.display = 'block';

  setTimeout(() => {
    alert.style.display = 'none';
  }, 6000);
}

// ============================================================
// GAME OVER
// ============================================================
async function triggerGameOver(deathCause) {
  playSFX('gameover');
  screenShake();

  const c = gameState && gameState.character ? gameState.character : {};
  const stats = c.stats || {};
  const cfg = AVATAR_CONFIG[currentAvatar];

  // Epitaphs by avatar
  const name = c.name || '???';
  const city = c.city || '???';
  const age = c.age || 16;
  const epitaphs = {
    angel:   `${name} a vecu dans la lumiere. Que son ame trouve le repos eternel.`,
    neutral: `${name}. Ne(e) a ${city}. Decede(e) a ${age} ans. Statistique accomplie.`,
    fallen:  `${name} a danse avec les ombres. La nuit l'a finalement reclame(e).`,
    devil:   `${name} a regne par le feu. Les cendres sont tout ce qui reste.`
  };
  const epitaph = epitaphs[currentAvatar] || epitaphs.neutral;

  document.getElementById('go-char-name').textContent = `${name} \u2014 ${city}`;
  document.getElementById('go-title').textContent = deathCause || (stats.health <= 0 ? 'Le Corps Rend l\'Ame' : 'L\'Ame Se Brise');
  document.getElementById('go-epitaph').textContent = epitaph;
  document.getElementById('go-age').textContent = age + ' ans';
  document.getElementById('go-days').textContent = c.day || 1;
  document.getElementById('go-chapters').textContent = c.total_chapters || 0;
  document.getElementById('go-karma').textContent = Math.round((c.karma || 0) * 100) + '%';
  document.getElementById('go-avatar').textContent = cfg ? cfg.emoji : '';

  // Timeline
  const timeline = document.getElementById('go-timeline');
  const history = (gameState && gameState.history) ? gameState.history.slice(-8) : [];
  timeline.innerHTML = history.map(h => {
    const emoji = AVATAR_EMOJIS[h.avatar] || '';
    return `<div class="go-timeline-entry">
      <span class="tl-day">J.${h.day}</span>
      <span class="tl-icon">${emoji}</span>
      <span>${h.summary || h.text || ''}</span>
    </div>`;
  }).join('');

  applyTheme(currentAvatar, true);
  showScreen('screen-gameover');
  stopAmbient();
}

// ============================================================
// RESTART
// ============================================================
async function restartGame() {
  playSFX('select');
  setLoading(true, 'Reinitialisation...');

  try {
    await api('/api/game/restart', { method: 'POST' });

    gameState = null;
    currentAvatar = 'angel';
    selectedAvatar = null;
    prevStats = null;

    document.querySelectorAll('.avatar-card').forEach(c => {
      c.style.opacity   = '1';
      c.classList.remove('selected');
    });

    const nameInput = document.getElementById('input-name');
    const cityInput = document.getElementById('input-city');
    if (nameInput) nameInput.value = '';
    if (cityInput) cityInput.value = '';

    document.getElementById('btn-start').classList.remove('visible');
    document.getElementById('save-resume').style.display = 'none';

    setLoading(false);
    applyTheme('angel', false);
    showScreen('screen-character');

  } catch (e) {
    setLoading(false);
    showNotif('Erreur: ' + e.message);
  }
}

// ============================================================
// HISTORY TOGGLE
// ============================================================
function toggleHistory() {
  document.getElementById('history-toggle').classList.toggle('collapsed');
  document.getElementById('history-log').classList.toggle('collapsed');
}

// ============================================================
// SHARE DEATH CARD
// ============================================================
async function shareDeathCard() {
  const shareCanvas = document.getElementById('share-canvas');
  const shareCtx = shareCanvas.getContext('2d');
  shareCanvas.width = 600;
  shareCanvas.height = 400;

  const c = gameState && gameState.character ? gameState.character : {};
  const stats = c.stats || {};
  const name = c.name || '???';
  const city = c.city || '???';
  const age = c.age || 16;
  const day = c.day || 1;
  const totalChapters = c.total_chapters || 0;
  const karma = c.karma || 0;

  // Background
  const grad = shareCtx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, '#0a0a12');
  grad.addColorStop(1, '#050508');
  shareCtx.fillStyle = grad;
  shareCtx.fillRect(0, 0, 600, 400);

  // Border
  shareCtx.strokeStyle = 'rgba(240,192,64,0.3)';
  shareCtx.lineWidth = 1;
  shareCtx.strokeRect(20, 20, 560, 360);

  // Title
  shareCtx.fillStyle = '#f0c040';
  shareCtx.font = 'bold 28px serif';
  shareCtx.textAlign = 'center';
  shareCtx.fillText('ANIMUS', 300, 70);

  // Name
  shareCtx.fillStyle = '#e0d0b0';
  shareCtx.font = 'italic 18px serif';
  shareCtx.fillText(name, 300, 110);

  // City + Age
  shareCtx.fillStyle = '#806040';
  shareCtx.font = '12px monospace';
  shareCtx.fillText(city + ' \u2014 ' + age + ' ans', 300, 135);

  // Title earned
  if (c.current_title) {
    shareCtx.fillStyle = '#f0c040';
    shareCtx.font = '11px monospace';
    shareCtx.fillText('\u00AB ' + c.current_title + ' \u00BB', 300, 158);
  }

  // Stats
  shareCtx.font = '11px monospace';
  shareCtx.textAlign = 'left';
  const statLabels = [
    ['\u2665 Sante', Math.round(stats.health || 0)],
    ['\u2605 Bonheur', Math.round(stats.happiness || 0)],
    ['\u25C6 Richesse', Math.round(stats.wealth || 0)],
    ['\u263D Moralite', Math.round(stats.morality || 0)]
  ];
  statLabels.forEach((s, i) => {
    shareCtx.fillStyle = '#806040';
    shareCtx.fillText(s[0], 180, 200 + i * 22);
    shareCtx.fillStyle = s[1] <= 20 ? '#ff4040' : '#c0a060';
    shareCtx.fillText(s[1] + '/100', 360, 200 + i * 22);
  });

  // Karma
  shareCtx.textAlign = 'center';
  shareCtx.fillStyle = '#f0c040';
  shareCtx.font = 'bold 14px monospace';
  shareCtx.fillText('Karma: ' + Math.round(karma * 100) + '%', 300, 310);

  // Days + chapters
  shareCtx.fillStyle = '#806040';
  shareCtx.font = '11px monospace';
  shareCtx.fillText('Jour ' + day + ' \u2014 ' + totalChapters + ' chapitres', 300, 335);

  // Footer
  shareCtx.fillStyle = '#403020';
  shareCtx.font = '9px monospace';
  shareCtx.fillText('animus \u2014 l\'influence invisible', 300, 385);

  // Download
  const link = document.createElement('a');
  link.download = 'animus_' + name + '.png';
  link.href = shareCanvas.toDataURL('image/png');
  link.click();

  // Claim share bonus
  try {
    const data = await api('/api/shop/claim-share', { method: 'POST' });
    if (data.bonus) {
      ctmBalance = data.newBalance || ctmBalance + data.bonus;
      updateCTMDisplay();
      showNotif(`+${data.bonus} CTM pour le partage !`);
    }
  } catch (e) {
    // Share bonus may already be claimed
  }
}

// ============================================================
// SHOP
// ============================================================
async function showShop() {
  showScreen('screen-shop');
  playSFX('select');

  try {
    const data = await api('/api/shop/packs');
    ctmBalance = data.balance || ctmBalance;
    updateCTMDisplay();

    const balEl = document.getElementById('shop-balance');
    if (balEl) balEl.textContent = ctmBalance;

    // Update pack display if server provides dynamic packs
    if (data.packs && data.packs.length > 0) {
      const grid = document.getElementById('shop-grid');
      grid.innerHTML = data.packs.map(pack => {
        const popular = pack.popular ? ' pack-popular' : '';
        const divine = pack.divine ? ' pack-divine' : '';
        const badge = pack.badge ? `<div class="pack-badge">${pack.badge}</div>` : '';
        return `<div class="shop-pack${popular}${divine}" onclick="buyPack('${pack.id}')">
          ${badge}
          <div class="pack-name">${pack.name}</div>
          <div class="pack-ctm">${pack.ctm} CTM</div>
          <div class="pack-price">${pack.price}</div>
          <div class="pack-desc">${pack.desc || ''}</div>
        </div>`;
      }).join('');
    }

    // Update costs display if server provides
    if (data.costs) {
      const costsGrid = document.querySelector('.shop-costs-grid');
      if (costsGrid) {
        costsGrid.innerHTML = `
          <span>\u{1F54A}\uFE0F Ange: ${data.costs.angel || 4} CTM</span>
          <span>\u2696\uFE0F Neutre: ${data.costs.neutral || 3} CTM</span>
          <span>\u{1FA78} Dechu: ${data.costs.fallen || 1} CTM</span>
          <span>\u{1F525} Diable: GRATUIT</span>
        `;
      }
    }

  } catch (e) {
    console.error('Shop load error:', e);
  }
}

function closeShop() {
  if (gameState && gameState.character) {
    showScreen('screen-game');
  } else {
    showScreen('screen-intro');
  }
}

async function buyPack(packId) {
  playSFX('select');
  setLoading(true, 'Redirection vers le paiement...');

  try {
    const data = await api('/api/shop/checkout', {
      method: 'POST',
      body: { packId }
    });

    setLoading(false);

    if (data.url) {
      window.location.href = data.url;
    } else {
      showNotif('Erreur de redirection de paiement.');
    }

  } catch (e) {
    setLoading(false);
    showNotif('Erreur: ' + e.message);
  }
}

async function claimDaily() {
  try {
    const data = await api('/api/shop/claim-daily', { method: 'POST' });
    if (data.bonus) {
      ctmBalance = data.newBalance || ctmBalance + data.bonus;
      updateCTMDisplay();
      showNotif(`+${data.bonus} CTM ! Bonus quotidien reclame.`);

      // Update shop balance display
      const balEl = document.getElementById('shop-balance');
      if (balEl) balEl.textContent = ctmBalance;

      // Disable the button
      const btn = document.getElementById('btn-claim-daily');
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    }
  } catch (e) {
    showNotif(e.message || 'Bonus deja reclame aujourd\'hui.');
  }
}

async function shareForCTM() {
  // Share functionality + CTM claim
  try {
    // Try Web Share API first
    if (navigator.share) {
      await navigator.share({
        title: 'ANIMUS — L\'Influence Invisible',
        text: 'Vis une vie entiere guidee par des forces invisibles. Chaque choix compte.',
        url: window.location.href
      });
    }

    const data = await api('/api/shop/claim-share', { method: 'POST' });
    if (data.bonus) {
      ctmBalance = data.newBalance || ctmBalance + data.bonus;
      updateCTMDisplay();
      showNotif(`+${data.bonus} CTM pour le partage !`);

      const balEl = document.getElementById('shop-balance');
      if (balEl) balEl.textContent = ctmBalance;
    }
  } catch (e) {
    showNotif(e.message || 'Bonus de partage deja reclame.');
  }
}

// ============================================================
// DAILY BONUS POPUP
// ============================================================
function showDailyBonus(amount) {
  const overlay = document.getElementById('daily-bonus-overlay');
  if (!overlay) return;

  const amountEl = overlay.querySelector('.daily-bonus-amount');
  if (amountEl) amountEl.textContent = '+' + amount + ' CTM';

  overlay.style.display = 'flex';
}

function closeDailyBonus() {
  const overlay = document.getElementById('daily-bonus-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ============================================================
// FRIENDS SYSTEM
// ============================================================
async function showFriends() {
  showScreen('screen-friends');
  playSFX('select');

  try {
    const data = await api('/api/social/friends');

    // Render friends list
    const listEl = document.getElementById('friend-list');
    const friends = data.friends || [];

    if (friends.length === 0) {
      listEl.innerHTML = '<div class="friend-empty">Aucun ami pour le moment. Ajoute des joueurs !</div>';
    } else {
      listEl.innerHTML = friends.map(f => {
        const avatarEmoji = AVATAR_EMOJIS[f.current_avatar] || '\u2696\uFE0F';
        return `<div class="friend-entry">
          <span class="friend-avatar">${avatarEmoji}</span>
          <div class="friend-info">
            <span class="friend-name">${f.username || f.name || '???'}</span>
            <span class="friend-detail">${f.status || ''}</span>
          </div>
          <button class="friend-remove-btn" onclick="removeFriend('${f.userId || f.id}')" title="Retirer">\u2715</button>
        </div>`;
      }).join('');
    }

    // Render pending requests
    const pending = data.pending || [];
    const pendingSection = document.getElementById('friend-pending-section');
    const pendingList = document.getElementById('friend-pending-list');

    if (pending.length > 0) {
      pendingSection.style.display = 'block';
      pendingList.innerHTML = pending.map(p => {
        return `<div class="friend-pending-entry">
          <span class="friend-name">${p.username || p.from_username || '???'}</span>
          <div class="friend-pending-actions">
            <button class="friend-accept-btn" onclick="acceptFriend('${p.friendshipId || p.id}')">Accepter</button>
            <button class="friend-reject-btn" onclick="rejectFriend('${p.friendshipId || p.id}')">Refuser</button>
          </div>
        </div>`;
      }).join('');
    } else {
      pendingSection.style.display = 'none';
    }

  } catch (e) {
    console.error('Friends error:', e);
    showNotif('Erreur: ' + e.message);
  }
}

function closeFriends() {
  if (gameState && gameState.character) {
    showScreen('screen-game');
  } else {
    showScreen('screen-intro');
  }
}

async function searchFriend() {
  const input = document.getElementById('friend-search-input');
  const query = input.value.trim();
  if (!query || query.length < 2) {
    showNotif('Entre au moins 2 caracteres.');
    return;
  }

  const resultsEl = document.getElementById('friend-search-results');

  try {
    const data = await api('/api/social/search/' + encodeURIComponent(query));
    const results = data.results || [];

    if (results.length === 0) {
      resultsEl.innerHTML = '<div class="friend-empty">Aucun joueur trouve.</div>';
    } else {
      resultsEl.innerHTML = results.map(r => {
        const avatarEmoji = AVATAR_EMOJIS[r.current_avatar] || '\u2696\uFE0F';
        return `<div class="friend-search-entry">
          <span class="friend-avatar">${avatarEmoji}</span>
          <span class="friend-name">${r.username}</span>
          <button class="friend-add-btn" onclick="sendFriendRequest('${r.username}')">Ajouter</button>
        </div>`;
      }).join('');
    }

  } catch (e) {
    resultsEl.innerHTML = '<div class="friend-empty">Erreur de recherche.</div>';
  }
}

async function sendFriendRequest(username) {
  try {
    const data = await api('/api/social/request', {
      method: 'POST',
      body: { username }
    });
    showNotif(data.message || 'Demande envoyee !');
    playSFX('select');
  } catch (e) {
    showNotif(e.message || 'Erreur lors de l\'envoi.');
  }
}

async function acceptFriend(friendshipId) {
  try {
    await api('/api/social/accept', {
      method: 'POST',
      body: { friendshipId }
    });
    showNotif('Ami accepte !');
    playSFX('choice');
    showFriends(); // Refresh
  } catch (e) {
    showNotif(e.message || 'Erreur.');
  }
}

async function rejectFriend(friendshipId) {
  try {
    await api('/api/social/reject', {
      method: 'POST',
      body: { friendshipId }
    });
    showNotif('Demande refusee.');
    showFriends(); // Refresh
  } catch (e) {
    showNotif(e.message || 'Erreur.');
  }
}

async function removeFriend(friendUserId) {
  if (!confirm('Retirer cet ami ?')) return;

  try {
    await api('/api/social/remove', {
      method: 'POST',
      body: { friendUserId }
    });
    showNotif('Ami retire.');
    showFriends(); // Refresh
  } catch (e) {
    showNotif(e.message || 'Erreur.');
  }
}

// ============================================================
// LEADERBOARD
// ============================================================
async function showLeaderboard() {
  showScreen('screen-leaderboard');
  playSFX('select');

  const tableEl = document.getElementById('lb-table');
  tableEl.innerHTML = '<div class="lb-loading">Chargement du classement...</div>';

  try {
    const data = await api('/api/leaderboard/current');
    const leaderboard = data.leaderboard || [];

    // My rank
    if (data.myRank) {
      const myRankSection = document.getElementById('lb-my-rank');
      myRankSection.style.display = 'flex';
      document.getElementById('lb-my-position').textContent = '#' + data.myRank.rank;
      document.getElementById('lb-my-score').textContent = (data.myRank.score || 0) + ' pts';
    }

    // Table
    if (leaderboard.length === 0) {
      tableEl.innerHTML = '<div class="lb-empty">Aucun classement cette semaine.</div>';
    } else {
      const rankEmojis = { 1: '\u{1F451}', 2: '\u{1F948}', 3: '\u{1F949}' };
      tableEl.innerHTML = leaderboard.map((entry, i) => {
        const rank = i + 1;
        const emoji = rankEmojis[rank] || '';
        const avatarEmoji = AVATAR_EMOJIS[entry.current_avatar] || '';
        const isMe = entry.isMe ? ' lb-me' : '';
        return `<div class="lb-row${isMe}">
          <span class="lb-row-rank">${emoji} #${rank}</span>
          <span class="lb-row-avatar">${avatarEmoji}</span>
          <span class="lb-row-name">${entry.username || entry.name || '???'}</span>
          <span class="lb-row-score">${entry.score || 0} pts</span>
          <span class="lb-row-detail">J${entry.day || 0} \u00B7 ${entry.age || 16} ans \u00B7 K:${Math.round((entry.karma || 0) * 100)}%</span>
        </div>`;
      }).join('');
    }

  } catch (e) {
    console.error('Leaderboard error:', e);
    tableEl.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
  }
}

function closeLeaderboard() {
  if (gameState && gameState.character) {
    showScreen('screen-game');
  } else {
    showScreen('screen-intro');
  }
}

async function toggleLBHistory() {
  const histEl = document.getElementById('lb-history');
  if (!histEl) return;

  if (histEl.style.display === 'none') {
    histEl.style.display = 'block';

    try {
      const data = await api('/api/leaderboard/history');
      const weeks = data.weeks || [];

      if (weeks.length === 0) {
        histEl.innerHTML = '<div class="lb-empty">Aucun historique.</div>';
      } else {
        histEl.innerHTML = weeks.map(w => {
          const winner = w.winner || {};
          return `<div class="lb-history-entry">
            <span class="lb-history-week">${w.week_label || w.week || ''}</span>
            <span class="lb-history-winner">${winner.username || '???'} \u2014 ${winner.score || 0} pts</span>
          </div>`;
        }).join('');
      }

    } catch (e) {
      histEl.innerHTML = '<div class="lb-empty">Erreur de chargement.</div>';
    }
  } else {
    histEl.style.display = 'none';
  }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
  // 1, 2, 3 to pick choices
  if (['1', '2', '3'].includes(e.key)) {
    const btns = document.querySelectorAll('#choices-grid .choice-btn:not([disabled])');
    const idx = parseInt(e.key) - 1;
    if (btns[idx]) btns[idx].click();
  }

  // Space / Enter to skip cinematic or start
  if (e.key === ' ' || e.key === 'Enter') {
    if (!cinematicDone) {
      e.preventDefault();
      skipCinematic();
    }
  }

  // M to toggle sound
  if (e.key === 'm' || e.key === 'M') {
    toggleSound();
  }

  // Escape to close overlays
  if (e.key === 'Escape') {
    closeMilestone();
    closeDailyBonus();
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
      const id = activeScreen.id;
      if (id === 'screen-shop') closeShop();
      if (id === 'screen-friends') closeFriends();
      if (id === 'screen-leaderboard') closeLeaderboard();
    }
  }
});

// ============================================================
// SAVE INDICATOR (cosmetic only — server saves)
// ============================================================
function flashSaveIndicator() {
  const ind = document.getElementById('save-indicator');
  if (ind) {
    ind.textContent = 'Sauvegarde OK';
    ind.classList.remove('saved');
    void ind.offsetHeight;
    ind.classList.add('saved');
    setTimeout(() => { ind.textContent = 'Sauvegarde auto'; }, 2000);
  }
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
});

resizeCanvas();
initParticles('angel');
animateParticles();

// Check for payment callback (Stripe redirect)
(function checkPaymentCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    setTimeout(() => {
      showNotif('Paiement reussi ! CTM credites.');
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }, 1000);
  }
  if (params.get('payment') === 'cancel') {
    setTimeout(() => {
      showNotif('Paiement annule.');
      window.history.replaceState({}, '', window.location.pathname);
    }, 1000);
  }
})();

// Start on cinematic screen
showScreen('screen-cinematic');
