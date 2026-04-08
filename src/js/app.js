/**
 * Initialisation globale et logique principale
 * Point d'entree du jeu apres le chargement du DOM
 */

document.addEventListener('DOMContentLoaded', () => {
    debugLog('='.repeat(50));
    debugLog('ANGEL NARRATIVE - Initializing...');
    debugLog('='.repeat(50));

    try {
        // Initialiser les composants dans l'ordre correct
        debugLog('Step 1: Initializing game state...');
        gameState.checkWeekReset();

        debugLog('Step 2: Building SVG...');
        svgBuilder.build();

        debugLog('Step 3: Initializing angel animator...');
        angelAnimator.updateAngel();

        debugLog('Step 4: Loading questions...');
        questionManager.loadQuestions();

        // Setup des event listeners
        debugLog('Step 5: Setting up event listeners...');
        setupScrollListener();
        setupDeathModal();
        setupPersistence();

        debugLog('='.repeat(50));
        debugLog('App initialized successfully!');
        debugLog('='.repeat(50));
        debugLog('Game State:', gameState.getStats());

    } catch (error) {
        errorLog('CRITICAL ERROR during initialization:', error);
        console.trace(error);
    }
});

/**
 * Ecouter le scroll pour l'effet parallax de l'ange
 */
function setupScrollListener() {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const angelSection = document.querySelector('.angel-section');
                if (!angelSection) return;

                const scrollY = window.scrollY;

                if (scrollY > 100) {
                    angelSection.classList.add('scrolled');
                } else {
                    angelSection.classList.remove('scrolled');
                }

                // Parallax subtle
                if (supportsAnimations()) {
                    angelSection.style.transform = `translateY(${scrollY * 0.5}px)`;
                }

                ticking = false;
            });
            ticking = true;
        }
    });

    debugLog('Scroll listener setup');
}

/**
 * Setup du modal de mort
 */
function setupDeathModal() {
    const modal = document.getElementById('deathModal');

    if (!modal) {
        warnLog('Death modal not found in DOM');
        return;
    }

    // Afficher si l'ange est mort
    if (gameState.isDead) {
        const info = document.getElementById('deathInfo');
        if (info) {
            const deathType = gameState.deathType || 'Fin Mysterieuse';
            info.innerHTML = `
                L'ange s'est eteint apres ${gameState.chapter} chapitres.<br/>
                <strong>Histoire Figee: ${deathType}</strong><br/>
                Votre saga est sauvegardee a jamais.
            `;
        }
        modal.classList.add('show');
    }

    // Fermer en cliquant dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    debugLog('Death modal setup');
}

/**
 * Auto-save + prevenir perte de donnees (un seul listener beforeunload)
 */
function setupPersistence() {
    // Auto-save toutes les 30 secondes
    setInterval(() => {
        gameState.save();
        debugLog('Auto-saved game state');
    }, 30000);

    // Sauvegarder et prevenir fermeture accidentelle
    window.addEventListener('beforeunload', (e) => {
        gameState.save();
        if (!gameState.isDead && gameState.choices.length > 0) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    debugLog('Persistence setup (auto-save 30s + beforeunload)');
}

/**
 * Fonction globale pour la resurrection
 * Appelee par le bouton dans le modal de mort
 */
window.resurrectAngel = function() {
    debugLog('Resurrection requested');

    const confirmed = confirm(
        'Resurrection de l\'ange\n\n' +
        'Cela coutera 2EUR et creera une nouvelle histoire.\n' +
        'Votre saga precedente restera sauvegardee.\n\n' +
        'Continuer?'
    );

    if (!confirmed) return;

    // TODO: Integrer Stripe pour le paiement
    debugLog('Payment processing would happen here (Stripe)');

    // Pour la demo: reinitialiser simplement
    gameState.reset();
    location.reload();
};

/**
 * Export des instances globales pour acces depuis la console
 */
window.DEBUG = {
    game: gameState,
    animator: angelAnimator,
    api: apiManager,
    questions: questionManager,

    exportData: () => gameState.export(),
    getStats: () => gameState.getStats(),
    resetGame: () => gameState.reset(),
    simulateChoice: (choiceIdx) => {
        const q = CONFIG.QUESTIONS[gameState.chapter % CONFIG.QUESTIONS.length];
        if (q.choices[choiceIdx]) {
            questionManager.submitChoice(choiceIdx, q.choices[choiceIdx], gameState.chapter);
        }
    }
};

debugLog('Debug tools available at window.DEBUG');

// Mode developpement
if (CONFIG.DEBUG) {
    console.log('%cAngel Narrative - DEBUG MODE ACTIVE', 'color: #d4af37; font-size: 16px; font-weight: bold;');
    console.log('Use window.DEBUG for development tools');
    console.table(gameState.getStats());
}
