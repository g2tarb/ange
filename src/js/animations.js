/**
 * Animations et expressions de l'ange
 * Change l'apparence selon l'alignement moral
 */

class AngelAnimator {
    constructor() {
        this.currentPersonality = 'neutral';
        this.lastUpdate = 0;
        this.updateThrottle = 100; // Éviter trop de mises à jour
    }

    updateAngel() {
        const now = Date.now();
        if (now - this.lastUpdate < this.updateThrottle) return;
        this.lastUpdate = now;

        const personality = gameState.getPersonalityType();
        const config = CONFIG.PERSONALITIES[personality];
        
        debugLog('Angel personality:', personality, 'Alignment:', gameState.alignment);
        
        this.updateEyes(config);
        this.updateHalo(config);
        this.updateCorruption(config);
        this.updateWings(config);
        this.updateAlignmentBars();
        
        this.currentPersonality = personality;
    }

    updateEyes(config) {
        const leftPupil = document.getElementById('left-eye-pupil');
        const rightPupil = document.getElementById('right-eye-pupil');
        const leftShine = document.getElementById('left-eye-shine');
        const rightShine = document.getElementById('right-eye-shine');
        
        if (leftPupil && rightPupil) {
            leftPupil.setAttribute('fill', config.eyeColor);
            rightPupil.setAttribute('fill', config.eyeColor);
        }
        
        // Changer l'expression selon l'alignement
        if (config.eyeColor === '#ff6b6b') {
            // Yeux malveillants
            if (leftPupil) {
                leftPupil.setAttribute('cy', '120');
                leftPupil.setAttribute('ry', '14');
            }
            if (rightPupil) {
                rightPupil.setAttribute('cy', '120');
                rightPupil.setAttribute('ry', '14');
            }
        }
    }

    updateHalo(config) {
        const halo = document.getElementById('halo');
        const haloSecondary = document.getElementById('halo-secondary');
        
        if (halo) {
            halo.setAttribute('stroke', config.haloColor);
        }
        if (haloSecondary) {
            haloSecondary.setAttribute('stroke', config.haloColor);
        }
    }

    updateCorruption(config) {
        const corruptionGlow = document.getElementById('corruption-glow');
        const corruptionMarks = document.getElementById('corruption-marks');
        const horns = document.getElementById('horns');
        
        if (corruptionGlow) {
            corruptionGlow.style.opacity = config.corruptionOpacity;
        }
        if (corruptionMarks) {
            corruptionMarks.style.opacity = config.corruptionOpacity;
        }
        if (horns) {
            horns.style.opacity = config.hornsOpacity;
        }
    }

    updateWings(config) {
        const wingsGroup = document.getElementById('wings-group');
        
        if (wingsGroup) {
            wingsGroup.style.opacity = config.wingsOpacity;
        }
    }

    updateAlignmentBars() {
        const goodBar = document.getElementById('goodBar');
        const neutralBar = document.getElementById('neutralBar');
        const evilBar = document.getElementById('evilBar');
        
        const good = gameState.alignment.good;
        const neutral = gameState.alignment.neutral;
        const evil = gameState.alignment.evil;
        
        if (goodBar) goodBar.style.width = good + '%';
        if (neutralBar) neutralBar.style.width = neutral + '%';
        if (evilBar) evilBar.style.width = evil + '%';
        
        debugLog('Alignment bars updated:', { good, neutral, evil });
    }

    // Animations spéciales
    animateExpressionChange() {
        const svg = document.getElementById('angelSvg');
        if (!svg) return;
        
        svg.style.animation = 'none';
        setTimeout(() => {
            svg.style.animation = '';
        }, 10);
    }
}

// Créer l'instance globale
const angelAnimator = new AngelAnimator();
