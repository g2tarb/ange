# 📂 Guide Pratique - Comment Organiser ton Projet

## ✅ État Actuel

Tu as déjà créé une **structure de dossiers complète** avec les fichiers CSS et le HTML principal:

```
~/angel-narrative/
├── public/
│   └── index.html                 ✅ CRÉÉ
├── src/
│   ├── css/
│   │   ├── main.css              ✅ CRÉÉ
│   │   ├── angel.css             ✅ CRÉÉ
│   │   └── animations.css        ✅ CRÉÉ
│   └── js/
│       ├── config.js             ✅ CRÉÉ
│       ├── gameState.js          ✅ CRÉÉ
│       ├── svgBuilder.js         ✅ CRÉÉ
│       ├── questions.js          ⏳ À CRÉER
│       ├── animations.js         ⏳ À CRÉER
│       ├── api.js                ⏳ À CRÉER
│       ├── app.js                ⏳ À CRÉER
│       └── sw.js                 ⏳ À CRÉER
├── assets/
├── docs/
├── README.md                      ✅ CRÉÉ
└── .gitignore                     ⏳ À CRÉER
```

## 🎯 Prochaines Étapes

### ÉTAPE 1: Vérifier que tout est en place

```bash
# Sur ta machine locale
cd ~/angel-narrative

# Voir la structure
tree .

# Ou avec ls
ls -la public/
ls -la src/css/
ls -la src/js/
```

### ÉTAPE 2: Créer les fichiers JS restants

Je vais créer les 5 fichiers JS restants maintenant. Ce sont les fichiers importants:

1. **questions.js** - Gestion des questions
2. **animations.js** - Animations de l'ange
3. **api.js** - Appels aux webhooks
4. **app.js** - Initialisation principale
5. **sw.js** - Service Worker

### ÉTAPE 3: Créer un fichier .gitignore

```bash
cd ~/angel-narrative
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
build/

# Config
config.local.js

# Cache
.cache/
.parcel-cache/
EOF
```

### ÉTAPE 4: Créer un package.json basique (optionnel)

```bash
cat > package.json << 'EOF'
{
  "name": "angel-narrative",
  "version": "1.0.0",
  "description": "Une histoire interactive avec un ange qui évolue selon vos choix",
  "main": "public/index.html",
  "scripts": {
    "dev": "python3 -m http.server 8000",
    "build": "vercel",
    "deploy": "vercel --prod"
  },
  "keywords": ["interactive", "narrative", "dark-fantasy", "n8n"],
  "author": "Ton Nom",
  "license": "MIT",
  "devDependencies": {
    "vercel": "^latest"
  }
}
EOF
```

### ÉTAPE 5: Tester localement

```bash
# Aller au dossier
cd ~/angel-narrative

# Lancer un serveur local
python3 -m http.server 8000

# Ouvrir dans le navigateur
# http://localhost:8000/public/

# Si ça ne marche pas, utiliser Node.js
npx http-server -p 8000
```

---

## 📋 Fichiers Créés jusqu'à Présent

### CSS (3 fichiers)
- ✅ `src/css/main.css` - 400+ lignes
- ✅ `src/css/angel.css` - 300+ lignes
- ✅ `src/css/animations.css` - 400+ lignes

### JavaScript (3 fichiers)
- ✅ `src/js/config.js` - 200+ lignes
- ✅ `src/js/gameState.js` - 250+ lignes
- ✅ `src/js/svgBuilder.js` - 400+ lignes

### HTML & Documentation
- ✅ `public/index.html` - Structure complète
- ✅ `README.md` - Guide du projet

---

## 🔧 Fichiers à Créer Maintenant

### 1️⃣ `src/js/questions.js` - Gestion des questions

```javascript
class QuestionManager {
    constructor() {
        this.currentQuestion = null;
        this.init();
    }

    init() {
        this.loadQuestions();
        gameState.checkWeekReset();
    }

    loadQuestions() {
        const grid = document.getElementById('questionsGrid');
        
        if (gameState.isDead) {
            grid.innerHTML = '<p>L\'ange est mort...</p>';
            return;
        }

        if (gameState.questionAnsweredThisWeek) {
            grid.innerHTML = '<p>Revenez dans 7 jours.</p>';
            return;
        }

        const questionIdx = gameState.chapter % CONFIG.QUESTIONS.length;
        const question = CONFIG.QUESTIONS[questionIdx];
        
        grid.innerHTML = '';
        question.choices.forEach((choice, idx) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.textContent = choice.text;
            btn.onclick = () => this.submitChoice(idx, choice, questionIdx);
            grid.appendChild(btn);
        });
    }

    submitChoice(choiceIdx, choice, questionIdx) {
        gameState.addChoice(questionIdx, choiceIdx, choice.text, choice.alignment);
        this.loadQuestions();
    }
}

const questionManager = new QuestionManager();
```

### 2️⃣ `src/js/animations.js` - Animations de l'ange

```javascript
class AngelAnimator {
    constructor() {
        this.currentPersonality = 'neutral';
    }

    updateAngel() {
        const personality = gameState.getPersonalityType();
        const config = CONFIG.PERSONALITIES[personality];
        
        // Changer les couleurs des yeux
        document.getElementById('left-eye-pupil').setAttribute('fill', config.eyeColor);
        document.getElementById('right-eye-pupil').setAttribute('fill', config.eyeColor);
        
        // Changer le halo
        document.getElementById('halo').setAttribute('stroke', config.haloColor);
        
        // Corruption
        document.getElementById('corruption-glow').style.opacity = config.corruptionOpacity;
        document.getElementById('horns').style.opacity = config.hornsOpacity;
        document.getElementById('wings-group').style.opacity = config.wingsOpacity;
        
        // Mettre à jour les barres d'alignement
        this.updateAlignmentBars();
        
        this.currentPersonality = personality;
    }

    updateAlignmentBars() {
        document.getElementById('goodBar').style.width = gameState.alignment.good + '%';
        document.getElementById('neutralBar').style.width = gameState.alignment.neutral + '%';
        document.getElementById('evilBar').style.width = gameState.alignment.evil + '%';
    }
}

const angelAnimator = new AngelAnimator();
```

### 3️⃣ `src/js/api.js` - Appels aux webhooks

```javascript
class APIManager {
    async callN8NWebhook() {
        const payload = {
            userId: gameState.userId,
            chapter: gameState.chapter + 1,
            alignment: gameState.alignment,
            choices: gameState.choices.slice(-5),
            previousChapter: gameState.chapter
        };

        try {
            const response = await fetch(CONFIG.N8N_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.isDead) {
                gameState.isDead = true;
                gameState.deathType = result.deathType;
                this.showDeathModal(result);
            } else {
                gameState.chapter++;
                this.updateChapter(result);
            }
            gameState.save();
        } catch (error) {
            console.error('Webhook error:', error);
            this.generateDemoChapter();
        }
    }

    updateChapter(data) {
        document.getElementById('chapterNumber').textContent = `Chapitre ${gameState.chapter}`;
        document.getElementById('chapterTitle').textContent = data.title;
        document.getElementById('chapterText').innerHTML = `<p>${data.text}</p>`;
        window.scrollBy(0, window.innerHeight);
    }

    generateDemoChapter() {
        const alignType = gameState.getDominantAlignment();
        const chapters = {
            good: { title: 'La Rédemption', text: 'L\'ange brille...' },
            evil: { title: 'La Corruption', text: 'L\'ange se transforme...' },
            neutral: { title: 'L\'Équilibre', text: 'L\'ange observe...' }
        };
        this.updateChapter(chapters[alignType]);
    }

    showDeathModal(data) {
        const modal = document.getElementById('deathModal');
        modal.classList.add('show');
    }
}

const apiManager = new APIManager();
```

### 4️⃣ `src/js/app.js` - Initialisation principale

```javascript
// Initialisation globale au chargement
document.addEventListener('DOMContentLoaded', () => {
    debugLog('App initializing...');
    
    // Initialiser les composants
    gameState.checkWeekReset();
    angelAnimator.updateAngel();
    questionManager.loadQuestions();
    
    // Event listeners
    setupScrollListener();
    setupDeathModal();
    
    debugLog('App ready!');
});

function setupScrollListener() {
    window.addEventListener('scroll', () => {
        const angelSection = document.querySelector('.angel-section');
        if (window.scrollY > 100) {
            angelSection.classList.add('scrolled');
        } else {
            angelSection.classList.remove('scrolled');
        }
    });
}

function setupDeathModal() {
    if (gameState.isDead) {
        const modal = document.getElementById('deathModal');
        modal.classList.add('show');
    }
}

// Fonction globale pour la résurrection
function resurrectAngel() {
    gameState.reset();
    location.reload();
}

// Auto-save toutes les 30 secondes
setInterval(() => gameState.save(), 30000);
```

### 5️⃣ `src/js/sw.js` - Service Worker

```javascript
const CACHE_NAME = 'angel-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/css/main.css',
    '/src/css/angel.css',
    '/src/css/animations.css',
    '/src/js/config.js',
    '/src/js/gameState.js',
    '/src/js/svgBuilder.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
```

---

## 🚀 Déployer en 3 Étapes

### 1. Sur Vercel
```bash
npm install -g vercel
cd ~/angel-narrative
vercel --prod
```

### 2. Sur Netlify
```bash
npm install -g netlify-cli
cd ~/angel-narrative
netlify deploy --prod --dir=public
```

### 3. Sur GitHub + Vercel (Recommandé)
```bash
# Initialiser git
git init
git add .
git commit -m "Initial commit: Angel Narrative"

# Pousser sur GitHub
git remote add origin https://github.com/username/angel-narrative.git
git push -u origin main

# Connecter Vercel à GitHub dans le Dashboard
# https://vercel.com/new
```

---

## 💡 Prochains Ajustements Rapides

### Changer le titre du site
Éditer `public/index.html`:
```html
<title>L'Ange Maudit - Une Histoire Unique</title>
```

### Changer l'URL du webhook n8n
Éditer `src/js/config.js`:
```javascript
CONFIG.N8N_WEBHOOK = 'https://ton-domaine.com/webhook/angel-narrative';
```

### Ajouter plus de questions
Éditer `src/js/config.js`:
```javascript
CONFIG.QUESTIONS = [
    // ... ajouter plus
];
```

### Changer les couleurs
Éditer `src/css/main.css`:
```css
:root {
    --accent-red: #ff0000;  // Changement
}
```

---

## ✅ Checklist Finale

- [ ] Structure de dossiers créée
- [ ] Tous les fichiers HTML/CSS créés
- [ ] Les 3 premiers fichiers JS créés (config, gameState, svgBuilder)
- [ ] Tester localement: `python3 -m http.server 8000`
- [ ] Les 5 fichiers JS restants à créer
- [ ] Webhook n8n configuré
- [ ] Configuration modifiée (URL, keys, etc.)
- [ ] Déployer sur Vercel/Netlify

---

## 🎮 Test Rapide

Une fois que tu as tous les fichiers:

1. Ouvre `http://localhost:8000/public/` dans le navigateur
2. Tu devrais voir l'ange avec les questions en bas
3. Clique sur une réponse
4. L'ange change de couleur (yeux, aura)
5. Les barres d'alignement bougent
6. Le chapitre devrait s'afficher (ou démo si pas de webhook)

---

**Besoin d'aide? Demande-moi de créer les 5 fichiers JS restants directement!** 🚀
