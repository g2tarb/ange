/**
 * Communication avec les webhooks n8n
 * Envoie les données du joueur et reçoit les chapitres
 */

class APIManager {
    constructor() {
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async callN8NWebhook() {
        if (this.isLoading) {
            warnLog('API call already in progress');
            return;
        }

        this.isLoading = true;

        const payload = {
            userId: gameState.userId,
            chapter: gameState.chapter + 1,
            alignment: gameState.alignment,
            choices: gameState.choices.slice(-5),
            previousChapter: gameState.chapter
        };

        debugLog('Calling N8N webhook:', CONFIG.N8N_WEBHOOK);
        debugLog('Payload:', payload);

        try {
            const response = await Promise.race([
                fetch(CONFIG.N8N_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 15000)
                )
            ]);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            debugLog('Webhook response:', result);

            // Vérifier les conditions de mort
            if (gameState.checkDeathConditions() || result.isDead) {
                gameState.isDead = true;
                gameState.deathType = result.deathType || gameState.deathType;
                gameState.save();
                this.showDeathModal(result);
            } else {
                gameState.chapter++;
                gameState.save();
                this.updateChapter(result);
            }

            this.retryCount = 0;
        } catch (error) {
            errorLog('Webhook error:', error);
            
            // Retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                warnLog(`Retrying... (${this.retryCount}/${this.maxRetries})`);
                setTimeout(() => this.callN8NWebhook(), 2000);
            } else {
                // Générer un chapitre de démo si erreur après retries
                warnLog('Max retries reached, using demo chapter');
                this.generateDemoChapter();
            }
        } finally {
            this.isLoading = false;
        }
    }

    updateChapter(data) {
        debugLog('Updating chapter with data:', data);
        
        const chapterNumber = document.getElementById('chapterNumber');
        const chapterTitle = document.getElementById('chapterTitle');
        const chapterText = document.getElementById('chapterText');
        
        if (chapterNumber) chapterNumber.textContent = `Chapitre ${gameState.chapter}`;
        if (chapterTitle) chapterTitle.textContent = data.title || 'Chapitre Sans Nom';
        if (chapterText) {
            const text = data.text || 'À suivre...';
            chapterText.innerHTML = `<p>${text}</p>`;
        }
        
        // Scroll vers le chapitre avec délai
        setTimeout(() => {
            const narrativeContent = document.querySelector('.narrative-content');
            if (narrativeContent) {
                narrativeContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    generateDemoChapter() {
        const alignType = gameState.getDominantAlignment();
        
        const demoChapters = {
            good: {
                title: "Le Chemin de la Rédemption",
                text: "L'ange s'approche, ses ailes brillant d'une lueur bienveillante. Vous avez choisi la compassion, et cela résonne profondément. Sa voix est douce comme du miel cristallisé: 'Vous continuez sur la voie de la lumière. C'est rare et magnifique.' Une aura de chaleur vous enveloppe."
            },
            evil: {
                title: "La Corruption Progresse",
                text: "L'ange se transforme devant vous. Ses traits s'assombrissent, ses yeux s'enflamment d'un rouge sang. 'Vous avez osé choisir le pouvoir,' murmure-t-il, sa voix devenant aussi sombre que les ombres autour de vous. 'Je... apprécie cela.'"
            },
            neutral: {
                title: "L'Équilibre Instable",
                text: "L'ange reste immobile, ses traits impossibles à lire. Il ne penche ni vers la lumière ni vers les ombres. 'Intéressant,' dit-il simplement, 'Vous naviguez entre les deux mondes. Continuez, je suis curieux de voir où cela vous mènera.'"
            }
        };
        
        gameState.chapter++;
        gameState.save();
        this.updateChapter(demoChapters[alignType]);
    }

    showDeathModal(data) {
        const modal = document.getElementById('deathModal');
        const info = document.getElementById('deathInfo');
        
        if (info) {
            const deathType = data.deathType || gameState.deathType || 'Fin Mystérieuse';
            info.innerHTML = `
                L'ange s'est éteint dans <strong>${gameState.chapter} chapitres</strong>.<br/>
                <strong>Histoire Figée: ${deathType}</strong><br/>
                Votre saga est sauvegardée à jamais.
            `;
        }
        
        if (modal) {
            modal.classList.add('show');
        }
        
        debugLog('Death modal shown:', { deathType: data.deathType });
    }
}

// Créer l'instance globale
const apiManager = new APIManager();
