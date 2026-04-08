/**
 * Configuration du projet Angel Narrative
 * Modifier ces valeurs selon ton environnement
 */

const CONFIG = {
    // ===== ENVIRONMENT =====
    ENV: 'development', // 'development' | 'production'
    
    // ===== API ENDPOINTS =====
    N8N_WEBHOOK: 'https://your-domain.com/webhook/angel-narrative',
    API_BASE: 'https://api.your-domain.com',
    
    // ===== STRIPE (Pour résurrections 2€) =====
    STRIPE_PUBLIC_KEY: 'pk_test_xxxxx', // À remplacer
    STRIPE_AMOUNT: 200, // 2€ en centimes
    
    // ===== JEUX SETTINGS =====
    GAME: {
        MAX_CHAPTERS: 20,
        QUESTIONS_PER_WEEK: 1,
        RESURRECTION_COST: 2.00, // euros
        
        // Critères de mort
        DEATH_CONDITIONS: {
            CORRUPTION_THRESHOLD: 95,
            CORRUPTION_MIN_NEUTRAL: 10,
            MAX_CHAPTERS_DEFAULT: 50
        },
        
        // Alignements
        ALIGNMENT_RANGES: {
            PURE: 70,      // > 70 = bon
            CORRUPTED: 70  // > 70 = mauvais
        }
    },
    
    // ===== QUESTIONS POOL =====
    QUESTIONS: [
        {
            text: "Devrais-je punir l'innocent pour sauver les innocents?",
            choices: [
                { text: 'Non, jamais', alignment: { good: 20, evil: -20 } },
                { text: 'Si nécessaire', alignment: { neutral: 10, good: -10 } },
                { text: 'Le bien du plus grand nombre', alignment: { evil: 15, good: -10 } }
            ]
        },
        {
            text: "Qu'est-ce que la justice?",
            choices: [
                { text: 'Protéger les faibles', alignment: { good: 15, evil: -15 } },
                { text: 'Équilibre des forces', alignment: { neutral: 15 } },
                { text: 'Le droit du plus fort', alignment: { evil: 20, good: -15 } }
            ]
        },
        {
            text: "Une menace arrive. Comment réagir?",
            choices: [
                { text: 'Accueillir et pardonner', alignment: { good: 20, evil: -25 } },
                { text: 'Évaluer et décider', alignment: { neutral: 20, good: 5 } },
                { text: 'Annihiler avant qu\'il ne se propage', alignment: { evil: 20, good: -20 } }
            ]
        },
        {
            text: "Le pouvoir absolu, c'est...",
            choices: [
                { text: 'Une responsabilité', alignment: { good: 15, evil: -20 } },
                { text: 'Un outil', alignment: { neutral: 15 } },
                { text: 'La liberté', alignment: { evil: 20, good: -10 } }
            ]
        },
        {
            text: "Que méritent les traîtres?",
            choices: [
                { text: 'La rédemption', alignment: { good: 20, evil: -20 } },
                { text: 'La justice impartiale', alignment: { neutral: 15, good: 5 } },
                { text: 'L\'agonie éternelle', alignment: { evil: 25, good: -20 } }
            ]
        }
    ],
    
    // ===== PERSONNALITÉS DE L'ANGE =====
    PERSONALITIES: {
        pure: {
            eyeColor: '#e8d4f1',
            mouthStroke: '#e8d4f1',
            haloColor: 'url(#haloGradient-good)',
            corruptionOpacity: 0,
            hornsOpacity: 0,
            wingsOpacity: 0.6,
            voice: 'Vous avez choisi avec sagesse.'
        },
        neutral: {
            eyeColor: '#d4af37',
            mouthStroke: '#8b5a5a',
            haloColor: 'url(#haloGradient-neutral)',
            corruptionOpacity: 0,
            hornsOpacity: 0,
            wingsOpacity: 0.4,
            voice: 'Intéressant... Qu\'allez-vous faire maintenant?'
        },
        corrupted: {
            eyeColor: '#ff6b6b',
            mouthStroke: '#ff6b6b',
            haloColor: 'url(#haloGradient-evil)',
            corruptionOpacity: 0.8,
            hornsOpacity: 1,
            wingsOpacity: 0.2,
            voice: 'Vous avez osé. J\'aime ça.'
        }
    },
    
    // ===== LOCALSTORAGE KEYS =====
    STORAGE: {
        USER_ID: 'angelUserId',
        CHAPTER: 'angelChapter',
        ALIGNMENT: 'angelAlignment',
        CHOICES: 'angelChoices',
        IS_DEAD: 'angelDead',
        DEATH_TYPE: 'angelDeathType',
        QUESTION_ANSWERED: 'angelQuestionAnswered',
        LAST_QUESTION_DATE: 'angelLastQuestionDate',
        CURRENT_WEEK: 'angelCurrentWeek'
    },
    
    // ===== ANIMATIONS =====
    ANIMATIONS: {
        FADE_SPEED: 600,
        TRANSITION_SPEED: 300,
        MOUTH_SPEED: 600,
        EYE_SPEED: 400
    },
    
    // ===== DEBUG =====
    DEBUG: false, // Mettre à true pour les logs
    DEBUG_MODE: false, // Afficher les bounding boxes SVG
    
    // ===== ANALYTICS (optionnel) =====
    ANALYTICS: {
        ENABLED: true,
        GA_ID: 'G-xxxxx', // Google Analytics
        MIXPANEL_ID: 'xxxxx'
    }
};

/**
 * Fonctions utilitaires globales
 */

// Log avec prefix DEBUG
function debugLog(...args) {
    if (CONFIG.DEBUG) {
        console.log('[ANGEL]', ...args);
    }
}

// Error log
function errorLog(...args) {
    console.error('[ANGEL ERROR]', ...args);
}

// Warn log
function warnLog(...args) {
    console.warn('[ANGEL WARN]', ...args);
}

// Générer un ID utilisateur unique
function generateUserId() {
    const id = 'angel_' + Math.random().toString(36).substr(2, 9) + Date.now();
    return id;
}

// Obtenir la semaine actuelle
function getCurrentWeek() {
    return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
}

// Cloner un objet en profondeur
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Vérifier si en mobile
function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Vérifier si le navigateur supporte les animations
function supportsAnimations() {
    const style = document.documentElement.style;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
