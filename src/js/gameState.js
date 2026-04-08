/**
 * Gestion de l'état du jeu
 * Toutes les données persistantes du joueur
 */

class GameState {
    constructor() {
        this.userId = localStorage.getItem(CONFIG.STORAGE.USER_ID) || generateUserId();
        this.chapter = parseInt(localStorage.getItem(CONFIG.STORAGE.CHAPTER)) || 1;
        
        // Alignment (0-100)
        const savedAlignment = localStorage.getItem(CONFIG.STORAGE.ALIGNMENT);
        this.alignment = savedAlignment 
            ? JSON.parse(savedAlignment)
            : { good: 50, neutral: 50, evil: 50 };
        
        // Choix
        const savedChoices = localStorage.getItem(CONFIG.STORAGE.CHOICES);
        this.choices = savedChoices ? JSON.parse(savedChoices) : [];
        
        // État de mort
        this.isDead = localStorage.getItem(CONFIG.STORAGE.IS_DEAD) === 'true';
        this.deathType = localStorage.getItem(CONFIG.STORAGE.DEATH_TYPE);
        this.deathDate = null;
        
        // Questions
        this.questionAnsweredThisWeek = localStorage.getItem(CONFIG.STORAGE.QUESTION_ANSWERED) === 'true';
        this.lastQuestionDate = localStorage.getItem(CONFIG.STORAGE.LAST_QUESTION_DATE);
        
        debugLog('GameState initialized:', this);
    }

    /**
     * Sauvegarder l'état
     */
    save() {
        localStorage.setItem(CONFIG.STORAGE.USER_ID, this.userId);
        localStorage.setItem(CONFIG.STORAGE.CHAPTER, this.chapter);
        localStorage.setItem(CONFIG.STORAGE.ALIGNMENT, JSON.stringify(this.alignment));
        localStorage.setItem(CONFIG.STORAGE.CHOICES, JSON.stringify(this.choices));
        localStorage.setItem(CONFIG.STORAGE.IS_DEAD, this.isDead);
        localStorage.setItem(CONFIG.STORAGE.DEATH_TYPE, this.deathType);
        localStorage.setItem(CONFIG.STORAGE.QUESTION_ANSWERED, this.questionAnsweredThisWeek);
        localStorage.setItem(CONFIG.STORAGE.LAST_QUESTION_DATE, this.lastQuestionDate);
        
        debugLog('GameState saved');
    }

    /**
     * Réinitialiser complètement
     */
    reset() {
        Object.keys(CONFIG.STORAGE).forEach(key => {
            localStorage.removeItem(CONFIG.STORAGE[key]);
        });
        
        this.userId = generateUserId();
        this.chapter = 1;
        this.alignment = { good: 50, neutral: 50, evil: 50 };
        this.choices = [];
        this.isDead = false;
        this.deathType = null;
        this.questionAnsweredThisWeek = false;
        this.lastQuestionDate = null;
        
        this.save();
        debugLog('GameState reset');
    }

    /**
     * Ajouter un choix
     */
    addChoice(questionIdx, choiceIdx, choiceText, alignmentDelta) {
        this.choices.push({
            chapter: this.chapter,
            questionIdx,
            choiceIdx,
            choiceText,
            alignmentDelta,
            timestamp: Date.now()
        });

        // Mettre à jour l'alignement
        Object.keys(alignmentDelta).forEach(key => {
            this.alignment[key] = Math.max(0, Math.min(100, 
                this.alignment[key] + alignmentDelta[key]
            ));
        });

        // Marquer la question comme répondue cette semaine
        this.questionAnsweredThisWeek = true;
        this.lastQuestionDate = new Date().toISOString();

        this.save();
        debugLog('Choice added:', { questionIdx, choiceIdx, alignmentDelta });
    }

    /**
     * Vérifier si la semaine a changé
     */
    checkWeekReset() {
        const currentWeek = getCurrentWeek();
        const lastWeek = parseInt(localStorage.getItem(CONFIG.STORAGE.CURRENT_WEEK)) || currentWeek;

        if (lastWeek !== currentWeek) {
            this.questionAnsweredThisWeek = false;
            localStorage.setItem(CONFIG.STORAGE.CURRENT_WEEK, currentWeek);
            this.save();
            debugLog('Week reset');
        }
    }

    /**
     * Vérifier les conditions de mort
     */
    checkDeathConditions() {
        const { CORRUPTION_THRESHOLD, CORRUPTION_MIN_NEUTRAL, MAX_CHAPTERS_DEFAULT } = CONFIG.GAME.DEATH_CONDITIONS;
        
        let isDead = false;
        let deathType = null;

        // Condition 1: Corruption extrême
        if (this.alignment.evil > CORRUPTION_THRESHOLD && this.alignment.neutral < CORRUPTION_MIN_NEUTRAL) {
            isDead = true;
            deathType = 'Corruption Totale';
        }

        // Condition 2: Après X chapitres
        if (this.choices.length > MAX_CHAPTERS_DEFAULT) {
            isDead = true;
            deathType = this.alignment.evil > this.alignment.good ? 
                'Corruption Totale' : 
                (this.alignment.good > this.alignment.evil ? 'Ascension Sacrificielle' : 'Équilibre Brisé');
        }

        if (isDead) {
            this.isDead = true;
            this.deathType = deathType;
            this.deathDate = new Date().toISOString();
            this.save();
            debugLog('Angel is dead:', deathType);
        }

        return isDead;
    }

    /**
     * Obtenir l'alignement dominant
     */
    getDominantAlignment() {
        const alignments = {
            good: this.alignment.good,
            neutral: this.alignment.neutral,
            evil: this.alignment.evil
        };
        return Object.keys(alignments).reduce((a, b) => 
            alignments[a] > alignments[b] ? a : b
        );
    }

    /**
     * Obtenir le type de personnalité actuelle
     */
    getPersonalityType() {
        const dominant = this.getDominantAlignment();
        
        if (dominant === 'good' && this.alignment.good > CONFIG.GAME.ALIGNMENT_RANGES.PURE) {
            return 'pure';
        } else if (dominant === 'evil' && this.alignment.evil > CONFIG.GAME.ALIGNMENT_RANGES.CORRUPTED) {
            return 'corrupted';
        }
        return 'neutral';
    }

    /**
     * Statistiques
     */
    getStats() {
        return {
            userId: this.userId,
            chapter: this.chapter,
            alignment: deepClone(this.alignment),
            dominantAlignment: this.getDominantAlignment(),
            personalityType: this.getPersonalityType(),
            totalChoices: this.choices.length,
            isDead: this.isDead,
            deathType: this.deathType,
            deathDate: this.deathDate
        };
    }

    /**
     * Export JSON complet
     */
    export() {
        return {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0'
            },
            state: this.getStats(),
            choices: this.choices,
            chapters: [] // À remplir par l'app
        };
    }
}

// Instance globale
const gameState = new GameState();
