# 🎭 ANGEL NARRATIVE - Structure Complète

## 📁 ARBORESCENCE FINALE (✅ 14 fichiers créés)

```
angel-narrative/
│
├── 📄 README.md                          ✅ Guide du projet
├── 📄 SETUP_GUIDE.md                     ✅ Guide de setup
│
├── 📂 public/
│   └── 📄 index.html                     ✅ HTML principal (620 lignes)
│
├── 📂 src/
│   │
│   ├── 📂 css/
│   │   ├── 📄 main.css                   ✅ Styles principaux (280 lignes)
│   │   ├── 📄 angel.css                  ✅ Styles SVG (340 lignes)
│   │   └── 📄 animations.css             ✅ Animations (420 lignes)
│   │
│   └── 📂 js/
│       ├── 📄 config.js                  ✅ Configuration (220 lignes)
│       ├── 📄 gameState.js               ✅ Gestion d'état (280 lignes)
│       ├── 📄 svgBuilder.js              ✅ Constructeur SVG (450 lignes)
│       ├── 📄 questions.js               ✅ Gestion questions (80 lignes)
│       ├── 📄 animations.js              ✅ Animations ange (140 lignes)
│       ├── 📄 api.js                     ✅ Webhooks n8n (210 lignes)
│       ├── 📄 app.js                     ✅ Initialisation (260 lignes)
│       └── 📄 sw.js                      ✅ Service Worker (210 lignes)
│
├── 📂 assets/
│   ├── 📂 images/                        (À ajouter)
│   └── 📂 fonts/                         (À ajouter)
│
└── 📂 docs/
    └── (documentation additionnelle)
```

---

## 🎯 Fichiers Clés et Leur Rôle

### HTML & Structure
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `public/index.html` | 620 | Structure DOM + imports CSS/JS |

### Styles (1040 lignes total)
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `src/css/main.css` | 280 | Layout principal, grilles, flexbox |
| `src/css/angel.css` | 340 | SVG, transitions, expressions |
| `src/css/animations.css` | 420 | Keyframes, effets, micro-interactions |

### JavaScript (1850 lignes total)
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `src/js/config.js` | 220 | Configuration globale, questions pool |
| `src/js/gameState.js` | 280 | État du jeu, sauvegarde localStorage |
| `src/js/svgBuilder.js` | 450 | Construit dynamiquement le SVG |
| `src/js/questions.js` | 80 | Affiche et traite les réponses |
| `src/js/animations.js` | 140 | Change expressions selon alignement |
| `src/js/api.js` | 210 | Appels au webhook n8n |
| `src/js/app.js` | 260 | Initialisation globale |
| `src/js/sw.js` | 210 | Service Worker (offline) |

---

## 🔗 Flux de Communication

```
index.html
    ↓
    ├─→ config.js (Configuration)
    ├─→ gameState.js (Crée: gameState)
    ├─→ svgBuilder.js (Crée: svgBuilder)
    ├─→ questions.js (Crée: questionManager)
    ├─→ animations.js (Crée: angelAnimator)
    ├─→ api.js (Crée: apiManager)
    └─→ app.js (Lance tout + listeners)

Joueur clique sur une réponse
    ↓
questionManager.submitChoice()
    ↓
gameState.addChoice() (sauvegarde + alignement)
    ↓
angelAnimator.updateAngel() (change expressions)
    ↓
apiManager.callN8NWebhook()
    ↓
    ├─→ Webhook n8n
    │   └─→ Claude génère le chapitre
    │       └─→ Retour JSON
    └─→ gameState.checkDeathConditions() (vérifie mort)
    ↓
apiManager.updateChapter() (affiche le chapitre)
```

---

## 💾 Données Persistantes (localStorage)

```javascript
{
    // Identité du joueur
    angelUserId: "angel_xxxxx",
    
    // Progression
    angelChapter: 5,
    angelAlignment: {
        good: 62,
        neutral: 45,
        evil: 38
    },
    
    // Historique
    angelChoices: [
        { chapter: 1, choiceText: "...", timestamp: ... },
        // ... plus de choix
    ],
    
    // État de mort
    angelDead: false,
    angelDeathType: null,
    
    // Questions
    angelQuestionAnswered: true,
    angelLastQuestionDate: "2024-01-22T10:00:00Z"
}
```

---

## 🎨 Hiérarchie des Styles

```
CSS Variables (config de couleurs)
    ↓
main.css (layout, flexbox, grids)
    ├─→ angel.css (SVG, transitions)
    └─→ animations.css (keyframes, effects)
```

---

## 🔄 Cycle de Vie du Jeu

```
1. PAGE CHARGE
   └─→ DOMContentLoaded event
       └─→ app.js initialise tout
           ├─→ gameState.checkWeekReset()
           ├─→ angelAnimator.updateAngel()
           ├─→ questionManager.loadQuestions()
           └─→ setupListeners()

2. JOUEUR RÉPOND À UNE QUESTION
   └─→ click sur bouton
       └─→ questionManager.submitChoice()
           ├─→ gameState.addChoice() (sauvegarde)
           ├─→ angelAnimator.updateAngel() (animation)
           └─→ apiManager.callN8NWebhook()

3. WEBHOOK RÉPOND
   └─→ apiManager.updateChapter() (affiche)
       └─→ Vérifier mort: gameState.checkDeathConditions()

4. CHAQUE SEMAINE
   └─→ gameState.checkWeekReset() réinitialise les questions
```

---

## 🚀 Démarrage Rapide

### Option 1: Localement (Python)
```bash
cd ~/angel-narrative
python3 -m http.server 8000
# Ouvrir http://localhost:8000/public/
```

### Option 2: Localement (Node.js)
```bash
cd ~/angel-narrative
npx http-server -p 8000
# Ouvrir http://localhost:8000/public/
```

### Option 3: Déployer sur Vercel
```bash
cd ~/angel-narrative
npm install -g vercel
vercel --prod
```

---

## ⚙️ Configuration Avant Déploiement

### 1. Modifier `src/js/config.js`

```javascript
// Ligne ~15-20
CONFIG.N8N_WEBHOOK = 'https://your-domain.com/webhook/angel-narrative';
CONFIG.API_BASE = 'https://api.your-domain.com';
CONFIG.STRIPE_PUBLIC_KEY = 'pk_live_xxxxx';

// Ligne ~26
CONFIG.DEBUG = false; // ← IMPORTANT: true → false
```

### 2. Tester localement

```bash
python3 -m http.server 8000
# Ouvrir http://localhost:8000/public/
# Doit voir: l'ange + questions en bas + chapitre en bas
```

### 3. Déployer

```bash
vercel --prod
# ou
netlify deploy --prod --dir=public
```

---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|--------|
| **Fichiers totaux** | 14 |
| **Lignes de code** | ~2,890 |
| **CSS** | 1,040 lignes |
| **JavaScript** | 1,850 lignes |
| **Taille estimée** | ~250 KB non compressé |
| **Load time (3G)** | ~2-3 secondes |

---

## 🎮 Test Visuel

Après déploiement local (`python3 -m http.server 8000`):

1. **Page charge** → Voir l'ange avec questions en bas
2. **Clique question** → Couleur yeux change, barres alignement bougent
3. **Scroll** → Ange suit avec parallax, chapitre s'affiche
4. **Chaque clic** → Nouvelles animations, nouveau chapitre (ou démo)

---

## 🔧 Fichiers à Adapter

### Pour vos questions personnalisées
Éditer: `src/js/config.js` section `QUESTIONS`

### Pour changer l'apparence
Éditer: `src/css/main.css` variables `:root`

### Pour ajouter des perso d'ange
Éditer: `src/js/config.js` section `PERSONALITIES`

### Pour ajouter des événements spéciaux
Éditer: `src/js/app.js` fonction `setupScrollListener()`

---

## 🌐 Endpoints Utilisés

```
Frontend:
  http://localhost:8000/public/

n8n Webhook (POST):
  https://your-domain.com/webhook/angel-narrative

Stripe API:
  https://api.stripe.com/v1/payment_intents

Service Worker:
  src/js/sw.js (auto-enregistré)
```

---

## 🐛 Debug Mode

Pour activer le mode debug:

```javascript
// Dans src/js/config.js, ligne ~50
CONFIG.DEBUG = true;
```

Puis dans la console du navigateur (F12):
```javascript
// Voir les stats
window.DEBUG.getStats()

// Exporter les données
window.DEBUG.exportData()

// Simuler un choix
window.DEBUG.simulateChoice(0)

// Reset du jeu
window.DEBUG.resetGame()
```

---

## ✅ Checklist Avant Production

- [ ] config.js modifié (webhook URL, keys)
- [ ] DEBUG = false
- [ ] Testé localement
- [ ] n8n webhook configuré
- [ ] Stripe account en production
- [ ] Domaine custom configuré
- [ ] SSL/HTTPS activé
- [ ] Backups activés
- [ ] Monitoring en place
- [ ] Terms of Service rédigés

---

## 🎓 Ressources Utiles

- SVG animations: https://developer.mozilla.org/en-US/docs/Web/SVG
- Service Workers: https://developers.google.com/web/tools/workbox
- localStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- n8n docs: https://docs.n8n.io/
- Claude API: https://console.anthropic.com/

---

## 📞 Support

Si quelque chose ne fonctionne pas:

1. Ouvre la console (F12)
2. Cherche les messages d'erreur
3. Teste avec `python3 -m http.server 8000`
4. Vérifie que config.js est correct
5. Consulte les logs de n8n

---

**Tu as maintenant un jeu narratif complet et fonctionnel!** 🎉

**Prochaine étape:** Modifier `config.js` avec tes URLs et clés, puis tester localement.
