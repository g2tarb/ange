/* ============================================================
   ANIMUS — L'Influence Invisible
   script.js — Ultimate Edition
   ============================================================ */

'use strict';

// ============================================================
// AVATAR CONFIG
// ============================================================
const AVATAR_CONFIG = {
  angel: {
    name: "L'Ange Heureux",
    tag: "GUIDE CELESTE",
    emoji: "\u{1F54A}\uFE0F",
    theme: "theme-angel",
    karmaPos: 0.92,
    video: "../avatar/angeHeureux.mp4",
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
    ],
    systemPrompt: `Tu es un narrateur de vie interactive. L'avatar est un Ange Heureux qui guide l'humain vers la lumiere, la joie et la bonte.
Le personnage principal est un humain ordinaire. Genere un court chapitre narratif (3-4 phrases, style litteraire sombre-poetique en francais) et exactement 3 choix de vie.
L'ange pousse vers : travail epanouissant, relations sinceres, sante, altruisme, buts nobles.
Les choix doivent inclure un spectre : un choix tres positif, un modere, un tentant mais negatif.
Reponds UNIQUEMENT en JSON valide: {"chapter": "texte du chapitre...", "choices": [{"text": "choix 1", "karma_delta": 0.05, "hint": "hint court", "stat_effects": {"health": 5, "happiness": 10, "wealth": -2, "morality": 8}}, ...]}
karma_delta entre -0.15 et +0.15 (positif = vers ange, negatif = vers diable).
stat_effects: valeurs entre -20 et +20 pour chaque stat.`
  },

  neutral: {
    name: "Le Neutre",
    tag: "OBSERVATEUR FROID",
    emoji: "\u2696\uFE0F",
    theme: "theme-neutral",
    karmaPos: 0.5,
    video: "../avatar/angeNeutre.mp4",
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
    ],
    systemPrompt: `Tu es un narrateur de vie interactive. L'avatar est un etre Neutre qui voit la vie comme une equation froide, sans emotion, ni bien ni mal.
Genere un court chapitre narratif (3-4 phrases, style analytique-poetique en francais) et exactement 3 choix.
Le neutre pousse vers : efficacite, pragmatisme, solitude calculee, ambiguite morale, survie.
Reponds UNIQUEMENT en JSON valide: {"chapter": "texte...", "choices": [{"text": "choix", "karma_delta": 0.0, "hint": "hint", "stat_effects": {"health": 0, "happiness": -3, "wealth": 8, "morality": -2}}, ...]}
karma_delta tres faibles (-0.05 a +0.05) pour maintenir l'equilibre.
stat_effects: valeurs entre -15 et +15 pour chaque stat.`
  },

  fallen: {
    name: "L'Ange Dechu",
    tag: "AME BRISEE",
    emoji: "\u{1FA78}",
    theme: "theme-fallen",
    karmaPos: 0.2,
    video: "../avatar/angeDechu.mp4",
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
    ],
    systemPrompt: `Tu es un narrateur de vie interactive. L'avatar est un Ange Dechu, beau et maudit, qui pousse vers l'autodestruction, les addictions et la chute.
Genere un court chapitre narratif (3-4 phrases, style dark-poetique en francais) et exactement 3 choix.
L'ange dechu pousse vers : addiction, relations toxiques, decheance, beaute dans la ruine, nihilisme doux.
Reponds UNIQUEMENT en JSON valide: {"chapter": "texte...", "choices": [{"text": "choix", "karma_delta": -0.08, "hint": "hint", "stat_effects": {"health": -8, "happiness": 5, "wealth": -5, "morality": -10}}, ...]}
karma_delta entre -0.15 et -0.02.
stat_effects: valeurs entre -25 et +10 pour chaque stat. La sante et moralite descendent souvent.`
  },

  devil: {
    name: "Le Diable",
    tag: "PRINCE DES TENEBRES",
    emoji: "\u{1F525}",
    theme: "theme-devil",
    karmaPos: 0.05,
    video: "../avatar/diable.mp4",
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
    ],
    systemPrompt: `Tu es un narrateur de vie interactive. L'avatar est le Diable incarne qui pousse l'humain vers la violence, le crime et la damnation absolue.
Genere un court chapitre narratif (3-4 phrases, style sombre-intense en francais) et exactement 3 choix.
Le diable pousse vers : violence, crime, emprisonnement, destruction d'autrui, fins tragiques.
Reponds UNIQUEMENT en JSON valide: {"chapter": "texte...", "choices": [{"text": "choix", "karma_delta": -0.12, "hint": "hint", "stat_effects": {"health": -10, "happiness": -5, "wealth": 15, "morality": -20}}, ...]}
karma_delta entre -0.18 et -0.05.
stat_effects: valeurs entre -30 et +20. La moralite chute toujours fortement.`
  }
};

const AVATAR_EMOJIS = {
  angel: "\u{1F54A}\uFE0F",
  neutral: "\u2696\uFE0F",
  fallen: "\u{1FA78}",
  devil: "\u{1F525}"
};

// ============================================================
// GAME STATE
// ============================================================
const SAVE_KEY = 'animus_save_v4';
const START_AGE = 16;

// ============================================================
// WEBHOOK N8N — Remplace cette URL par ton webhook de production
// ============================================================
const WEBHOOK_URL = 'https://REMPLACE-PAR-TON-N8N.com/webhook/animus';

async function callClaude(body) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

function defaultState() {
  return {
    characterName: '',
    characterCity: '',
    karma: 0.75,
    day: 1,
    totalChapters: 0,
    chaptersToday: 0,
    lastPlayDate: null,
    selectedAvatar: 'angel',
    currentAvatar: 'angel',
    stats: { health: 80, happiness: 75, wealth: 40, morality: 70 },
    history: [],
    alive: true
  };
}

function getAge() {
  return START_AGE + state.day - 1;
}

function getHappinessCap() {
  if (state.karma >= 0.50) return 100;
  if (state.karma >= 0.35) return 60;
  if (state.karma >= 0.20) return 40;
  return 25;
}

let state = defaultState();
let selectedAvatar = null;
let soundEnabled = true;
let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;
let prevStats = null;

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
  } else if (state.currentAvatar) {
    initAudio();
    startAmbient(state.currentAvatar);
  }
}

// ============================================================
// SAVE / LOAD
// ============================================================
function saveState() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try { state = { ...defaultState(), ...JSON.parse(raw) }; }
    catch (e) { state = defaultState(); }
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
  el.style.display = 'flex';
  requestAnimationFrame(() => {
    el.classList.add('active');
    el.style.opacity = '1';
  });
}

// ============================================================
// SCREEN SHAKE
// ============================================================
function screenShake() {
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 500);
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

  showScreen('screen-character');
  applyTheme('angel', false);
}

// ============================================================
// CHARACTER CREATION
// ============================================================
function confirmCharacter() {
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

  state.characterName = name;
  state.characterCity = city;
  saveState();

  showScreen('screen-intro');
}

// Auto-skip cinematic after full animation
setTimeout(() => {
  const skipEl = document.getElementById('cine-skip');
  if (skipEl) {
    skipEl.style.cursor = 'pointer';
  }
}, 8000);

// ============================================================
// INTRO — AVATAR SELECTION
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
function startGame() {
  if (!selectedAvatar) return;

  initAudio();
  playSFX('choice');

  loadState();

  // Daily reset
  const today = new Date().toDateString();
  if (state.lastPlayDate !== today) {
    state.chaptersToday = 0;
    state.lastPlayDate  = today;
    if (state.totalChapters > 0) state.day++;
  }

  // Set chosen avatar as current guide (can be changed each day)
  state.selectedAvatar = selectedAvatar;
  state.currentAvatar  = selectedAvatar;

  // Only set karma to avatar default on first game, otherwise keep earned karma
  if (state.totalChapters === 0) {
    state.karma = AVATAR_CONFIG[selectedAvatar].karmaPos;
  }

  prevStats = { ...state.stats };
  saveState();

  showScreen('screen-game');
  applyTheme(selectedAvatar, true);
  updateAvatarSwitcher();
  updateGameUI();
  generateChapter();

  // First whisper after a short delay
  setTimeout(() => showWhisper(), 2000);
}

// ============================================================
// AVATAR SWITCHER (in-game)
// ============================================================
function switchAvatar(avatarKey) {
  if (avatarKey === state.currentAvatar) return;

  initAudio();
  playSFX('avatar_change');
  screenShake();

  const cfg = AVATAR_CONFIG[avatarKey];
  state.currentAvatar = avatarKey;
  state.selectedAvatar = avatarKey;
  saveState();

  showNotif(`${cfg.emoji} ${cfg.name} prend le controle...`);
  applyTheme(avatarKey, true);
  updateAvatarSwitcher();
  updateGameUI();
  showWhisper();
}

function updateAvatarSwitcher() {
  document.querySelectorAll('.switch-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.av === state.currentAvatar);
  });
}

// ============================================================
// DETERMINE AVATAR FROM KARMA
// ============================================================
function getAvatarFromKarma(karma) {
  if (karma >= 0.70) return 'angel';
  if (karma >= 0.45) return 'neutral';
  if (karma >= 0.20) return 'fallen';
  return 'devil';
}

// ============================================================
// AVATAR WHISPER SYSTEM
// ============================================================
let whisperTimeout = null;

function showWhisper(customText) {
  const cfg = AVATAR_CONFIG[state.currentAvatar];
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
  const av  = state.currentAvatar;
  const cfg = AVATAR_CONFIG[av];

  // Character identity bar
  const ciName = document.getElementById('ci-name');
  const ciAge  = document.getElementById('ci-age');
  const ciCity = document.getElementById('ci-city');
  if (ciName) ciName.textContent = state.characterName || '???';
  if (ciAge)  ciAge.textContent  = getAge() + ' ans';
  if (ciCity) ciCity.textContent = state.characterCity || '???';

  // Avatar panel
  document.getElementById('avatar-display-name').textContent = cfg.name;
  document.getElementById('avatar-display-tag').textContent  = cfg.tag;
  document.getElementById('game-avatar-placeholder').textContent = cfg.emoji;

  const vid = document.getElementById('game-avatar-video');
  const fullVideoPath = new URL(cfg.video, window.location.href).href;
  if (vid.src !== fullVideoPath) {
    vid.src = cfg.video;
    vid.onerror = () => { vid.style.display = 'none'; };
    vid.play().catch(() => {});
  }

  // Happiness cap based on karma
  const happinessCap = getHappinessCap();
  if (state.stats.happiness > happinessCap) {
    state.stats.happiness = happinessCap;
  }

  // Show cap indicator
  const capEl = document.getElementById('stat-happiness-cap');
  const lockEl = document.getElementById('stat-happiness-lock');
  if (happinessCap < 100) {
    capEl.classList.add('visible');
    capEl.style.left = happinessCap + '%';
    lockEl.classList.add('visible');
    lockEl.title = `Bonheur plafonne a ${happinessCap}% (karma trop bas)`;
  } else {
    capEl.classList.remove('visible');
    lockEl.classList.remove('visible');
  }

  // Stats bars with deltas
  ['health', 'happiness', 'wealth', 'morality'].forEach(k => {
    const val = Math.max(0, Math.min(100, state.stats[k]));
    const bar = document.getElementById(`stat-${k}`);
    const valEl = document.getElementById(`stat-${k}-val`);
    const deltaEl = document.getElementById(`stat-${k}-delta`);
    const row = bar.closest('.stat-row');

    bar.style.width = val + '%';
    valEl.textContent = Math.round(val);

    // Critical state
    row.classList.toggle('critical', val <= 20);

    // Color bar based on value
    if (val <= 20) {
      bar.style.background = 'linear-gradient(90deg, #ff2020, #ff4040)';
    } else if (val <= 40) {
      bar.style.background = 'linear-gradient(90deg, #ff8040, #ffaa60)';
    } else {
      bar.style.background = '';
    }

    // Show stat deltas
    if (showDeltas && prevStats) {
      const diff = Math.round(val - (prevStats[k] || 0));
      if (diff !== 0) {
        deltaEl.textContent = diff > 0 ? `+${diff}` : `${diff}`;
        deltaEl.className = `stat-delta ${diff > 0 ? 'positive' : 'negative'}`;
        // Reset animation
        deltaEl.style.animation = 'none';
        deltaEl.offsetHeight;
        deltaEl.style.animation = '';
      }
    }
  });

  // Karma cursor
  document.getElementById('karma-cursor').style.left = (state.karma * 100) + '%';

  // Karma avatars — highlight current
  document.querySelectorAll('.karma-avatar-icon').forEach(icon => {
    icon.classList.toggle('active', icon.dataset.k === av);
  });

  // Day / chapter counter
  document.getElementById('day-display').textContent     = state.day;
  document.getElementById('chapter-display').textContent = state.chaptersToday;

  const remaining = 3 - state.chaptersToday;
  document.getElementById('choices-remaining-label').textContent =
    remaining > 0
      ? `${remaining} chapitre${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`
      : 'Termine pour aujourd\'hui';

  // Daily limit
  const limitMsg    = document.getElementById('daily-limit-msg');
  const choicesGrid = document.getElementById('choices-grid');
  if (state.chaptersToday >= 3) {
    limitMsg.style.display    = 'block';
    choicesGrid.style.display = 'none';
  } else {
    limitMsg.style.display    = 'none';
    choicesGrid.style.display = 'flex';
  }

  // History log
  const log = document.getElementById('history-log');
  log.innerHTML = state.history.slice(-12).reverse().map(h => {
    const emoji = AVATAR_EMOJIS[h.avatar] || '';
    return `<div class="history-entry">
      <span class="av-icon">${emoji}</span>
      <span class="day-tag">J.${h.day}</span>
      ${h.summary}
    </div>`;
  }).join('');
}

// ============================================================
// GENERATE CHAPTER VIA CLAUDE API
// ============================================================
async function generateChapter() {
  if (state.chaptersToday >= 3) { updateGameUI(); return; }

  const av  = state.currentAvatar;
  const cfg = AVATAR_CONFIG[av];
  const randomLoading = cfg.loadingTexts[Math.floor(Math.random() * cfg.loadingTexts.length)];

  setLoading(true, randomLoading);
  const chapterEl = document.getElementById('chapter-text');
  chapterEl.classList.add('loading');
  chapterEl.textContent = '';

  const lastSummaries = state.history.slice(-3).map(h =>
    `J.${h.day}: ${h.summary} (avatar: ${h.avatar})`
  ).join('\n');

  const age = getAge();
  const contextPrompt = `
Personnage: ${state.characterName}, ${age} ans, vit a ${state.characterCity}.
Stats actuelles:
- Sante:    ${Math.round(state.stats.health)}/100
- Bonheur:  ${Math.round(state.stats.happiness)}/100 ${getHappinessCap() < 100 ? '(PLAFONNE a ' + getHappinessCap() + '% a cause du karma)' : ''}
- Richesse: ${Math.round(state.stats.wealth)}/100
- Moralite: ${Math.round(state.stats.morality)}/100
- Karma:    ${(state.karma * 100).toFixed(0)}% (0=diable, 100=ange)
- Jour de vie: ${state.day} (age: ${age} ans)
- Chapitre du jour: ${state.chaptersToday + 1}/3
${lastSummaries ? '\nDerniers choix:\n' + lastSummaries : ''}

Genere le chapitre ${state.chaptersToday + 1} du jour ${state.day}. Le personnage s'appelle ${state.characterName} et a ${age} ans. Adapte le recit a son age et sa ville (${state.characterCity}).
IMPORTANT: Les stat_effects doivent etre coherents avec le choix. Varie les consequences.
`;

  try {
    const data = await callClaude({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: cfg.systemPrompt,
      messages: [{ role: 'user', content: contextPrompt }]
    });

    const raw   = data.content?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    setLoading(false);
    chapterEl.classList.remove('loading');

    typewriterEffect('chapter-text', parsed.chapter);
    document.getElementById('chapter-header').textContent =
      `\u2014 Jour ${state.day} \u00B7 Chapitre ${state.chaptersToday + 1} \u2014`;

    renderChoices(parsed.choices || []);

  } catch (e) {
    console.error('API error:', e);
    setLoading(false);
    chapterEl.classList.remove('loading');
    chapterEl.textContent =
      "Les fils du destin sont brouilles... La connexion divine est rompue. Verifiez votre cle API.";

    renderChoices([
      { text: "Continuer malgre tout", karma_delta: 0,     hint: "Persistance", stat_effects: { health: 0, happiness: 2, wealth: 0, morality: 2 } },
      { text: "Attendre un signe",     karma_delta: 0.02,  hint: "Patience",    stat_effects: { health: 1, happiness: 1, wealth: 0, morality: 3 } },
      { text: "Se replier sur soi",    karma_delta: -0.02, hint: "Solitude",    stat_effects: { health: -1, happiness: -3, wealth: 0, morality: -1 } }
    ]);
  }
}

// ============================================================
// RENDER CHOICES
// ============================================================
function renderChoices(choices) {
  const grid = document.getElementById('choices-grid');
  grid.innerHTML = '';

  choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.style.animationDelay = `${0.1 + i * 0.15}s`;
    btn.innerHTML = `${c.text}<span class="choice-karma-hint">${c.hint || ''}</span>`;
    btn.addEventListener('click', () => makeChoice(c));
    grid.appendChild(btn);
  });
}

// ============================================================
// MAKE A CHOICE
// ============================================================
async function makeChoice(choiceData) {
  if (state.chaptersToday >= 3) return;

  initAudio();
  playSFX('choice');

  // Lock all buttons
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  // Save previous stats for delta display
  prevStats = { ...state.stats };

  // Karma shift
  const delta = choiceData.karma_delta || 0;
  state.karma = Math.max(0, Math.min(1, state.karma + delta));

  // Apply stat effects from API or fallback
  if (choiceData.stat_effects) {
    const fx = choiceData.stat_effects;
    const rand = () => Math.random() * 4 - 2;
    state.stats.health    += (fx.health || 0) + rand();
    state.stats.happiness += (fx.happiness || 0) + rand();
    state.stats.wealth    += (fx.wealth || 0) + rand();
    state.stats.morality  += (fx.morality || 0) + rand();
  } else {
    // Fallback: derive from karma delta
    const isPositive = delta >= 0;
    const intensity  = Math.abs(delta) * 10;
    const rand       = () => Math.random() * 6 - 3;
    state.stats.health    += (isPositive ?  intensity * 0.5  : -intensity * 1.5) + rand();
    state.stats.happiness += (isPositive ?  intensity * 2    : -intensity * 2)   + rand();
    state.stats.wealth    += (isPositive ?  intensity * 1    : -intensity * 0.5) + rand();
    state.stats.morality  += delta * 15 + rand();
  }

  Object.keys(state.stats).forEach(k => {
    state.stats[k] = Math.max(0, Math.min(100, state.stats[k]));
  });

  // Enforce happiness cap
  const cap = getHappinessCap();
  if (state.stats.happiness > cap) {
    state.stats.happiness = cap;
  }

  // History entry
  state.history.push({
    day:     state.day,
    chapter: state.chaptersToday + 1,
    summary: choiceData.text.substring(0, 60) + (choiceData.text.length > 60 ? '...' : ''),
    avatar:  state.currentAvatar
  });

  state.chaptersToday++;
  state.totalChapters++;

  // Avatar shift
  const newAvatar     = getAvatarFromKarma(state.karma);
  const avatarChanged = newAvatar !== state.currentAvatar;
  state.currentAvatar = newAvatar;

  saveState();

  if (avatarChanged) {
    const cfg2 = AVATAR_CONFIG[newAvatar];
    playSFX('avatar_change');
    screenShake();
    showNotif(`${cfg2.emoji} ${cfg2.name} prend le controle...`);
    setTimeout(() => {
      applyTheme(newAvatar, true);
      updateAvatarSwitcher();
      showWhisper();
    }, 600);
  }

  // Notify about happiness cap
  if (getHappinessCap() < 100 && state.stats.happiness >= getHappinessCap()) {
    setTimeout(() => {
      showNotif(`\u{1F512} Bonheur plafonne a ${getHappinessCap()}% — karma trop sombre`);
    }, avatarChanged ? 2000 : 500);
  }

  // Negative stat SFX
  if (delta < -0.05) {
    playSFX('negative');
    screenShake();
  }

  // Death check
  if (state.stats.health <= 0 || state.stats.happiness <= 0) {
    setTimeout(triggerGameOver, 1500);
    return;
  }

  updateGameUI(true);

  if (state.chaptersToday < 3) {
    // Whisper between chapters
    setTimeout(() => showWhisper(), 1200);
    setTimeout(generateChapter, 1600);
  }
}

// ============================================================
// GAME OVER
// ============================================================
async function triggerGameOver() {
  const cfg = AVATAR_CONFIG[state.currentAvatar];
  playSFX('gameover');
  screenShake();

  let epitaph = '';

  try {
    const data = await callClaude({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Ecris une epitaphe poetique courte (2-3 phrases en francais, style sombre et beau) pour ${state.characterName}, ${getAge()} ans, de ${state.characterCity}, qui a vecu ${state.day} jours sous l'influence de ${cfg.name}. Sante finale: ${Math.round(state.stats.health)}. Karma: ${(state.karma * 100).toFixed(0)}%. Reponds uniquement avec le texte de l'epitaphe.`
      }]
    });
    epitaph = data.content?.[0]?.text || '';
  } catch (e) {
    epitaph = 'Une vie vecue. Une vie consumee. Le reste est silence.';
  }

  // Populate game over screen
  const finalAge = getAge();
  document.getElementById('go-char-name').textContent =
    `${state.characterName} \u2014 ${state.characterCity}`;
  document.getElementById('go-title').textContent =
    state.stats.health <= 0 ? 'Le Corps Rend l\'Ame' : 'L\'Ame Se Brise';
  document.getElementById('go-epitaph').textContent = epitaph;
  document.getElementById('go-age').textContent      = finalAge + ' ans';
  document.getElementById('go-days').textContent     = state.day;
  document.getElementById('go-chapters').textContent = state.totalChapters;
  document.getElementById('go-karma').textContent    = (state.karma * 100).toFixed(0) + '%';
  document.getElementById('go-avatar').textContent   = cfg.emoji;

  // Build timeline
  const timeline = document.getElementById('go-timeline');
  const lastEntries = state.history.slice(-8);
  timeline.innerHTML = lastEntries.map(h => {
    const emoji = AVATAR_EMOJIS[h.avatar] || '';
    return `<div class="go-timeline-entry">
      <span class="tl-day">J.${h.day}</span>
      <span class="tl-icon">${emoji}</span>
      <span>${h.summary}</span>
    </div>`;
  }).join('');

  applyTheme(state.currentAvatar, true);
  showScreen('screen-gameover');
  stopAmbient();
}

// ============================================================
// RESTART
// ============================================================
function restartGame() {
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  selectedAvatar = null;
  prevStats = null;

  playSFX('select');

  document.querySelectorAll('.avatar-card').forEach(c => {
    c.style.opacity   = '1';
    c.classList.remove('selected');
  });

  // Reset inputs
  const nameInput = document.getElementById('input-name');
  const cityInput = document.getElementById('input-city');
  if (nameInput) nameInput.value = '';
  if (cityInput) cityInput.value = '';

  document.getElementById('btn-start').classList.remove('visible');
  applyTheme('angel', false);
  showScreen('screen-character');
}

// ============================================================
// HISTORY TOGGLE
// ============================================================
function toggleHistory() {
  document.getElementById('history-toggle').classList.toggle('collapsed');
  document.getElementById('history-log').classList.toggle('collapsed');
}

// ============================================================
// TYPEWRITER EFFECT (improved)
// ============================================================
function typewriterEffect(elementId, text, speed = 16) {
  const el = document.getElementById(elementId);
  el.textContent = '';
  el.classList.add('loading');
  let i = 0;

  const timer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(timer);
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
});

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

loadState();
if (state.alive && state.totalChapters > 0 && state.characterName) {
  setTimeout(() => {
    showNotif(`Partie de ${state.characterName} trouvee. Choisissez votre avatar pour continuer.`);
  }, 9000);
}

// Start on cinematic screen
showScreen('screen-cinematic');

// Handle Enter key + reset border on input
document.addEventListener('DOMContentLoaded', () => {
  ['input-name', 'input-city'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmCharacter();
      });
      el.addEventListener('input', () => {
        el.style.borderColor = '';
      });
    }
  });
});
