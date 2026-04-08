# 🎭 L'Ange Maudit - Structure du Projet

## 📁 Arborescence Complète

```
angel-narrative/
├── public/
│   └── index.html                 # Fichier HTML principal
│
├── src/
│   ├── css/
│   │   ├── main.css              # Styles principaux
│   │   ├── angel.css             # Styles spécifiques du SVG
│   │   └── animations.css        # Toutes les animations
│   │
│   └── js/
│       ├── config.js             # Configuration globale
│       ├── gameState.js          # Gestion de l'état du jeu
│       ├── svgBuilder.js         # Constructeur SVG dynamique
│       ├── questions.js          # Gestion des questions
│       ├── animations.js         # Animations de l'ange
│       ├── api.js                # Appels aux webhooks n8n
│       ├── app.js                # Initialisation et logique principale
│       └── sw.js                 # Service Worker (offline)
│
├── assets/
│   ├── images/                   # Images du projet
│   └── fonts/                    # Polices personnalisées
│
├── docs/
│   └── ARCHITECTURE.md           # Documentation technique
│
├── .gitignore
├── README.md
└── package.json                  # Si tu veux ajouter des dépendances


## 🚀 Démarrage Rapide

### 1. Créer la structure localement

```bash
# Depuis ta machine
mkdir -p ~/projects/angel-narrative
cd ~/projects/angel-narrative

# Créer les dossiers
mkdir -p public src/{css,js} assets/{images,fonts} docs
```

### 2. Copier les fichiers

Copie les fichiers HTML et CSS créés dans les bons dossiers:

```
public/
  └── index.html                 # À copier

src/
  ├── css/
  │   ├── main.css
  │   ├── angel.css
  │   └── animations.css
  │
  └── js/
      ├── config.js
      ├── gameState.js
      ├── svgBuilder.js
      ├── questions.js
      ├── animations.js
      ├── api.js
      ├── app.js
      └── sw.js
```

### 3. Tester localement

```bash
# Aller dans le dossier du projet
cd ~/projects/angel-narrative

# Lancer un serveur local (Python)
python3 -m http.server 8000

# Ou avec Node.js
npx http-server -p 8000

# Ouvrir dans le navigateur
# http://localhost:8000/public/
```

---

## 📋 Fichiers Créés et Leur Rôle

### `public/index.html`
- Fichier HTML principal
- Contient la structure DOM
- Importe tous les CSS et JS
- Liens vers les fichiers JavaScript

### `src/css/main.css`
- Styles globaux du site
- Variables CSS (couleurs, fonts)
- Layout principal (flex, grid)
- Styles du status bar, questions, chapitres

### `src/css/angel.css`
- Styles spécifiques du SVG
- Animations du SVG (halo, yeux, bouche)
- Transitions entre états (pur → neutre → démon)
- États visuels basés sur l'alignement

### `src/css/animations.css`
- Animations réutilisables (fadeIn, slideUp, etc.)
- Keyframes globales
- Effets de hover, pulse, shake
- Responsive animations

### `src/js/config.js`
- Configuration globale du jeu
- Endpoints API (n8n webhook)
- Clés Stripe
- Questions pool
- Personnalités de l'ange
- Settings debug

### `src/js/gameState.js`
- Classe pour gérer l'état du jeu
- Sauvegarde/chargement dans localStorage
- Vérification conditions de mort
- Gestion des choix
- Stats du joueur

### `src/js/svgBuilder.js`
- Classe qui construit dynamiquement le SVG
- Crée tous les éléments SVG
- Groupes d'expressions (yeux, sourcils, bouche)
- Corruption (marques, cornes, glow)

### `src/js/questions.js` (À créer)
- Classe QuestionManager
- Charge et affiche les questions
- Gère les clics sur les réponses
- Vérifie si la semaine a changé
- Désactive les questions après réponse

### `src/js/animations.js` (À créer)
- Classe AngelAnimator
- Change les expressions selon l'alignement
- Transitions fluides entre états
- Animations des yeux, sourire, aura

### `src/js/api.js` (À créer)
- Classe APIManager
- Appels au webhook n8n
- Récupération des chapitres
- Gestion des erreurs
- Retry logic

### `src/js/app.js` (À créer)
- Initialisation du jeu
- Event listeners globaux
- Scroll manager
- Coordination entre modules

### `src/js/sw.js` (À créer)
- Service Worker
- Cache offline
- Synchronisation en arrière-plan

---

## 🔗 Comment les Fichiers Interagissent

```
index.html
    ├── config.js              (Configuration globale)
    ├── gameState.js           (Crée: gameState instance)
    ├── svgBuilder.js          (Crée: svgBuilder instance)
    ├── questions.js           (Crée: questionManager instance)
    ├── animations.js          (Crée: angelAnimator instance)
    ├── api.js                 (Crée: apiManager instance)
    └── app.js                 (Initialise tout + logique principale)

app.js utilise:
  - gameState.addChoice() → anime l'ange
  - angelAnimator.updateAngel() → change les expressions
  - questionManager.loadQuestions() → affiche les questions
  - apiManager.callN8NWebhook() → appel au webhook
  - gameState.checkDeathConditions() → vérifie la mort
```

---

## 🎮 Flux du Jeu

```
1. Page charge
   └─> app.js initialise gameState, SVG, questions

2. Joueur répond à une question
   └─> questionManager.onChoice()
       └─> gameState.addChoice() (sauvegarde + alignement)
           └─> angelAnimator.updateAngel() (change expressions)
               └─> apiManager.callN8NWebhook() (génère chapitre)
                   └─> Afficher le chapitre
                       └─> Vérifier mort: gameState.checkDeathConditions()

3. Chaque semaine
   └─> gameState.checkWeekReset()
       └─> Réinitialiser questionAnsweredThisWeek
```

---

## ⚙️ Configuration Avant Déploiement

### 1. Modifier `src/js/config.js`

```javascript
CONFIG.N8N_WEBHOOK = 'https://votre-domaine.com/webhook/angel-narrative';
CONFIG.API_BASE = 'https://api.votre-domaine.com';
CONFIG.STRIPE_PUBLIC_KEY = 'pk_live_xxxxx';
CONFIG.DEBUG = false; // Mettre à false en production
```

### 2. Ajouter vos questions

```javascript
CONFIG.QUESTIONS = [
    {
        text: "Votre question",
        choices: [
            { text: 'Réponse 1', alignment: { good: 20, evil: -20 } },
            { text: 'Réponse 2', alignment: { neutral: 15 } },
            { text: 'Réponse 3', alignment: { evil: 15, good: -20 } }
        ]
    },
    // ... plus de questions
];
```

---

## 📦 Fichiers Restants à Créer

```bash
# questions.js - Gestion des questions
# animations.js - Animations de l'ange
# api.js - Appels n8n
# app.js - Initialisation globale
# sw.js - Service Worker
```

Tu veux que je crée ces 5 fichiers maintenant?

---

## 🌐 Déployer sur Vercel

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Déployer
cd ~/projects/angel-narrative
vercel --prod

# 3. Configurer le domaine custom
vercel domain add your-domain.com
```

---

## 🐛 Debug Mode

Pour activer le mode debug:

```javascript
// Dans config.js
CONFIG.DEBUG = true;
CONFIG.DEBUG_MODE = true; // Affiche les bounding boxes SVG
```

Ensuite dans la console du browser:
```javascript
debugLog('Message');
gameState.getStats();
svgBuilder.build();
```

---

## 💾 Sauvegarde des Données

Les données sont automatiquement sauvegardées dans localStorage:

```javascript
// Voir les données sauvegardées
console.log(localStorage);

// Effacer les données
localStorage.clear();

// Exporter les données
console.log(gameState.export());
```

---

## 🎨 Personnaliser le Style

Toutes les couleurs sont dans les variables CSS:

```css
:root {
    --bg-dark: #0a0a0a;          /* Fond noir */
    --accent-red: #8b0000;        /* Rouge foncé */
    --accent-gold: #d4af37;       /* Or */
    --angel-good: #e8d4f1;        /* Bleu clair */
}
```

Modifie ces valeurs pour changer le thème.

---

## 📱 Responsive

Le site est responsive pour:
- Desktop (1920x1080)
- Tablet (768px)
- Mobile (< 500px)

Les breakpoints:
```css
@media (max-width: 768px) { ... }
```

---

## 🔒 Sécurité

- Toutes les données sensibles dans .env
- API calls validées côté serveur
- CORS configuré pour n8n uniquement
- Rate limiting sur les webhooks

---

## 📚 Ressources Utiles

- Berserk ref: https://berserk.fandom.com
- SVG animations: https://developer.mozilla.org/en-US/docs/Web/SVG
- n8n docs: https://docs.n8n.io
- Claude API: https://console.anthropic.com

---

## ✅ Checklist Avant Production

- [ ] Config modifiée (webhooks, keys)
- [ ] DEBUG = false
- [ ] SSL/HTTPS activé
- [ ] n8n webhook testé
- [ ] Stripe keys production
- [ ] Domaine custom configuré
- [ ] Backups en place
- [ ] Monitoring active
- [ ] GDPR compliant
- [ ] Terms of Service rédigés

---

**Prêt à lancer ton jeu narratif!** 🚀
