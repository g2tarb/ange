/**
 * Gestion des questions du jeu
 * Affiche et traite les reponses du joueur
 */

class QuestionManager {
    constructor() {
        this.currentQuestion = null;
    }

    loadQuestions() {
        const grid = document.getElementById('questionsGrid');

        if (!grid) {
            warnLog('Questions grid not found');
            return;
        }

        // Si mort, afficher message
        if (gameState.isDead) {
            grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--accent-red);">L\'ange est mort. Votre histoire est figee.</p>';
            return;
        }

        // Si question deja repondue cette semaine
        if (gameState.questionAnsweredThisWeek) {
            grid.innerHTML = '<p style="grid-column: 1/-1; color: var(--accent-gold);">Vous avez repondu cette semaine. Revenez dans 7 jours.</p>';
            return;
        }

        // Charger la question actuelle
        const questionIdx = gameState.chapter % CONFIG.QUESTIONS.length;
        const question = CONFIG.QUESTIONS[questionIdx];

        grid.innerHTML = '';
        question.choices.forEach((choice, idx) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn fade-in-cascade';
            btn.textContent = choice.text;
            btn.style.pointerEvents = 'auto';
            btn.onclick = (e) => {
                e.preventDefault();
                this.submitChoice(idx, choice, questionIdx);
            };
            grid.appendChild(btn);
        });

        debugLog('Questions loaded:', { questionIdx, questionCount: CONFIG.QUESTIONS.length });
    }

    submitChoice(choiceIdx, choice, questionIdx) {
        debugLog('Choice submitted:', { choiceIdx, choice });

        // Ajouter le choix et mettre a jour l'alignement
        gameState.addChoice(questionIdx, choiceIdx, choice.text, choice.alignment);

        // Animer l'ange
        if (typeof angelAnimator !== 'undefined') {
            angelAnimator.updateAngel();
        }

        // Appeler le webhook n8n
        if (typeof apiManager !== 'undefined') {
            apiManager.callN8NWebhook();
        }

        // Recharger les questions apres delai
        setTimeout(() => this.loadQuestions(), 500);
    }
}

// Instance globale
const questionManager = new QuestionManager();
