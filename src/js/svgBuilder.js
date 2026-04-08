/**
 * Construction dynamique du SVG de l'ange
 * Génère les calques d'expressions animées
 */

class SVGBuilder {
    constructor(containerId = 'angelSvg') {
        this.container = document.getElementById(containerId);
        this.svgNS = 'http://www.w3.org/2000/svg';
        this.defs = null;
        this.build();
    }

    /**
     * Construire le SVG complet
     */
    build() {
        this.container.innerHTML = ''; // Clear
        
        // Créer les defs (filtres et gradients)
        this.createDefs();
        
        // Créer les groupes du visage
        this.createHalo();
        this.createFaceStructure();
        this.createWings();
        this.createExpression();
        this.createCorruption();
        
        debugLog('SVG built');
    }

    /**
     * Créer les filtres et gradients
     */
    createDefs() {
        this.defs = document.createElementNS(this.svgNS, 'defs');
        
        // Filtre glow
        const filter = document.createElementNS(this.svgNS, 'filter');
        filter.setAttribute('id', 'glow');
        const blur = document.createElementNS(this.svgNS, 'feGaussianBlur');
        blur.setAttribute('stdDeviation', '2');
        blur.setAttribute('result', 'coloredBlur');
        filter.appendChild(blur);
        const merge = document.createElementNS(this.svgNS, 'feMerge');
        const node1 = document.createElementNS(this.svgNS, 'feMergeNode');
        node1.setAttribute('in', 'coloredBlur');
        const node2 = document.createElementNS(this.svgNS, 'feMergeNode');
        node2.setAttribute('in', 'SourceGraphic');
        merge.appendChild(node1);
        merge.appendChild(node2);
        filter.appendChild(merge);
        this.defs.appendChild(filter);
        
        // Gradients pour halos
        ['good', 'neutral', 'evil'].forEach(type => {
            const gradient = document.createElementNS(this.svgNS, 'radialGradient');
            gradient.setAttribute('id', `haloGradient-${type}`);
            
            const stop1 = document.createElementNS(this.svgNS, 'stop');
            stop1.setAttribute('offset', '0%');
            const stop2 = document.createElementNS(this.svgNS, 'stop');
            stop2.setAttribute('offset', '100%');
            
            if (type === 'good') {
                stop1.setAttribute('style', 'stop-color:#e8d4f1;stop-opacity:0.8');
                stop2.setAttribute('style', 'stop-color:#e8d4f1;stop-opacity:0');
            } else if (type === 'neutral') {
                stop1.setAttribute('style', 'stop-color:#d4af37;stop-opacity:0.8');
                stop2.setAttribute('style', 'stop-color:#d4af37;stop-opacity:0');
            } else {
                stop1.setAttribute('style', 'stop-color:#8b0000;stop-opacity:0.8');
                stop2.setAttribute('style', 'stop-color:#8b0000;stop-opacity:0');
            }
            
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            this.defs.appendChild(gradient);
        });
        
        this.container.appendChild(this.defs);
    }

    /**
     * Créer le halo
     */
    createHalo() {
        const halo = document.createElementNS(this.svgNS, 'circle');
        halo.setAttribute('id', 'halo');
        halo.setAttribute('cx', '150');
        halo.setAttribute('cy', '120');
        halo.setAttribute('r', '100');
        halo.setAttribute('fill', 'none');
        halo.setAttribute('stroke', 'url(#haloGradient-good)');
        halo.setAttribute('stroke-width', '3');
        halo.setAttribute('opacity', '0.6');
        halo.setAttribute('filter', 'url(#glow)');
        
        this.container.appendChild(halo);
    }

    /**
     * Créer la structure du visage
     */
    createFaceStructure() {
        // Crâne
        const skull = document.createElementNS(this.svgNS, 'ellipse');
        skull.setAttribute('cx', '150');
        skull.setAttribute('cy', '120');
        skull.setAttribute('rx', '70');
        skull.setAttribute('ry', '85');
        skull.setAttribute('fill', '#2a2a2a');
        skull.setAttribute('stroke', '#8b7355');
        skull.setAttribute('stroke-width', '2');
        this.container.appendChild(skull);
        
        // Cheveux
        const hairBack = document.createElementNS(this.svgNS, 'path');
        hairBack.setAttribute('d', 'M 80 120 Q 80 40, 150 25 Q 220 40, 220 120');
        hairBack.setAttribute('fill', '#0a0a0a');
        hairBack.setAttribute('stroke', '#3a3a3a');
        hairBack.setAttribute('stroke-width', '2');
        this.container.appendChild(hairBack);
        
        // Détails cheveux
        const hairLeft = document.createElementNS(this.svgNS, 'path');
        hairLeft.setAttribute('d', 'M 85 100 Q 85 45, 150 35');
        hairLeft.setAttribute('fill', 'none');
        hairLeft.setAttribute('stroke', '#1a1a1a');
        hairLeft.setAttribute('stroke-width', '2');
        hairLeft.setAttribute('opacity', '0.6');
        this.container.appendChild(hairLeft);
        
        const hairRight = document.createElementNS(this.svgNS, 'path');
        hairRight.setAttribute('d', 'M 215 100 Q 215 45, 150 35');
        hairRight.setAttribute('fill', 'none');
        hairRight.setAttribute('stroke', '#1a1a1a');
        hairRight.setAttribute('stroke-width', '2');
        hairRight.setAttribute('opacity', '0.6');
        this.container.appendChild(hairRight);
    }

    /**
     * Créer les ailes
     */
    createWings() {
        const wingsGroup = document.createElementNS(this.svgNS, 'g');
        wingsGroup.setAttribute('id', 'wings-group');
        wingsGroup.setAttribute('opacity', '0.4');
        
        // Aile gauche
        const wingL1 = document.createElementNS(this.svgNS, 'path');
        wingL1.setAttribute('d', 'M 100 100 Q 50 80, 40 160 Q 50 180, 100 160');
        wingL1.setAttribute('fill', 'none');
        wingL1.setAttribute('stroke', '#b8b8b8');
        wingL1.setAttribute('stroke-width', '2');
        wingL1.setAttribute('opacity', '0.5');
        wingsGroup.appendChild(wingL1);
        
        const wingL2 = document.createElementNS(this.svgNS, 'path');
        wingL2.setAttribute('d', 'M 95 110 Q 55 95, 50 150');
        wingL2.setAttribute('fill', 'none');
        wingL2.setAttribute('stroke', '#d4d4d4');
        wingL2.setAttribute('stroke-width', '1');
        wingL2.setAttribute('opacity', '0.4');
        wingsGroup.appendChild(wingL2);
        
        // Aile droite
        const wingR1 = document.createElementNS(this.svgNS, 'path');
        wingR1.setAttribute('d', 'M 200 100 Q 250 80, 260 160 Q 250 180, 200 160');
        wingR1.setAttribute('fill', 'none');
        wingR1.setAttribute('stroke', '#b8b8b8');
        wingR1.setAttribute('stroke-width', '2');
        wingR1.setAttribute('opacity', '0.5');
        wingsGroup.appendChild(wingR1);
        
        const wingR2 = document.createElementNS(this.svgNS, 'path');
        wingR2.setAttribute('d', 'M 205 110 Q 245 95, 250 150');
        wingR2.setAttribute('fill', 'none');
        wingR2.setAttribute('stroke', '#d4d4d4');
        wingR2.setAttribute('stroke-width', '1');
        wingR2.setAttribute('opacity', '0.4');
        wingsGroup.appendChild(wingR2);
        
        this.container.appendChild(wingsGroup);
    }

    /**
     * Créer les expressions (yeux, sourcils, bouche)
     */
    createExpression() {
        // Groupe des yeux
        const eyesGroup = document.createElementNS(this.svgNS, 'g');
        eyesGroup.setAttribute('id', 'eyes-layer');
        
        // Oeil gauche
        const eyeL_bg = document.createElementNS(this.svgNS, 'ellipse');
        eyeL_bg.setAttribute('cx', '120');
        eyeL_bg.setAttribute('cy', '110');
        eyeL_bg.setAttribute('rx', '15');
        eyeL_bg.setAttribute('ry', '20');
        eyeL_bg.setAttribute('fill', '#1a1a1a');
        eyeL_bg.setAttribute('stroke', '#3a3a3a');
        eyeL_bg.setAttribute('stroke-width', '1');
        eyesGroup.appendChild(eyeL_bg);
        
        const eyeL_pupil = document.createElementNS(this.svgNS, 'ellipse');
        eyeL_pupil.setAttribute('id', 'left-eye-pupil');
        eyeL_pupil.setAttribute('cx', '120');
        eyeL_pupil.setAttribute('cy', '115');
        eyeL_pupil.setAttribute('rx', '8');
        eyeL_pupil.setAttribute('ry', '12');
        eyeL_pupil.setAttribute('fill', '#e8d4f1');
        eyesGroup.appendChild(eyeL_pupil);
        
        const eyeL_shine = document.createElementNS(this.svgNS, 'circle');
        eyeL_shine.setAttribute('id', 'left-eye-shine');
        eyeL_shine.setAttribute('cx', '122');
        eyeL_shine.setAttribute('cy', '112');
        eyeL_shine.setAttribute('r', '3');
        eyeL_shine.setAttribute('fill', 'white');
        eyeL_shine.setAttribute('opacity', '0.7');
        eyesGroup.appendChild(eyeL_shine);
        
        // Oeil droit
        const eyeR_bg = document.createElementNS(this.svgNS, 'ellipse');
        eyeR_bg.setAttribute('cx', '180');
        eyeR_bg.setAttribute('cy', '110');
        eyeR_bg.setAttribute('rx', '15');
        eyeR_bg.setAttribute('ry', '20');
        eyeR_bg.setAttribute('fill', '#1a1a1a');
        eyeR_bg.setAttribute('stroke', '#3a3a3a');
        eyeR_bg.setAttribute('stroke-width', '1');
        eyesGroup.appendChild(eyeR_bg);
        
        const eyeR_pupil = document.createElementNS(this.svgNS, 'ellipse');
        eyeR_pupil.setAttribute('id', 'right-eye-pupil');
        eyeR_pupil.setAttribute('cx', '180');
        eyeR_pupil.setAttribute('cy', '115');
        eyeR_pupil.setAttribute('rx', '8');
        eyeR_pupil.setAttribute('ry', '12');
        eyeR_pupil.setAttribute('fill', '#e8d4f1');
        eyesGroup.appendChild(eyeR_pupil);
        
        const eyeR_shine = document.createElementNS(this.svgNS, 'circle');
        eyeR_shine.setAttribute('id', 'right-eye-shine');
        eyeR_shine.setAttribute('cx', '182');
        eyeR_shine.setAttribute('cy', '112');
        eyeR_shine.setAttribute('r', '3');
        eyeR_shine.setAttribute('fill', 'white');
        eyeR_shine.setAttribute('opacity', '0.7');
        eyesGroup.appendChild(eyeR_shine);
        
        this.container.appendChild(eyesGroup);
        
        // Groupe des sourcils
        const browsGroup = document.createElementNS(this.svgNS, 'g');
        browsGroup.setAttribute('id', 'brows-layer');
        
        const browL = document.createElementNS(this.svgNS, 'path');
        browL.setAttribute('id', 'left-brow');
        browL.setAttribute('d', 'M 105 95 Q 120 85, 135 90');
        browL.setAttribute('stroke', '#3a3a3a');
        browL.setAttribute('stroke-width', '2');
        browL.setAttribute('fill', 'none');
        browL.setAttribute('stroke-linecap', 'round');
        browsGroup.appendChild(browL);
        
        const browR = document.createElementNS(this.svgNS, 'path');
        browR.setAttribute('id', 'right-brow');
        browR.setAttribute('d', 'M 165 90 Q 180 85, 195 95');
        browR.setAttribute('stroke', '#3a3a3a');
        browR.setAttribute('stroke-width', '2');
        browR.setAttribute('fill', 'none');
        browR.setAttribute('stroke-linecap', 'round');
        browsGroup.appendChild(browR);
        
        this.container.appendChild(browsGroup);
        
        // Nez
        const nose = document.createElementNS(this.svgNS, 'path');
        nose.setAttribute('d', 'M 150 110 L 150 135 L 148 140 L 152 140');
        nose.setAttribute('stroke', '#4a4a4a');
        nose.setAttribute('stroke-width', '1');
        nose.setAttribute('fill', 'none');
        this.container.appendChild(nose);
        
        // Groupe de la bouche
        const mouthGroup = document.createElementNS(this.svgNS, 'g');
        mouthGroup.setAttribute('id', 'mouth-layer');
        
        const mouthPath = document.createElementNS(this.svgNS, 'path');
        mouthPath.setAttribute('id', 'mouth-path');
        mouthPath.setAttribute('d', 'M 130 155 Q 150 160, 170 155');
        mouthPath.setAttribute('stroke', '#8b5a5a');
        mouthPath.setAttribute('stroke-width', '2');
        mouthPath.setAttribute('fill', 'none');
        mouthPath.setAttribute('stroke-linecap', 'round');
        mouthGroup.appendChild(mouthPath);
        
        this.container.appendChild(mouthGroup);
    }

    /**
     * Créer les éléments de corruption
     */
    createCorruption() {
        // Marques de corruption
        const corruptionGroup = document.createElementNS(this.svgNS, 'g');
        corruptionGroup.setAttribute('id', 'corruption-marks');
        corruptionGroup.setAttribute('opacity', '0');
        
        const markL = document.createElementNS(this.svgNS, 'ellipse');
        markL.setAttribute('cx', '120');
        markL.setAttribute('cy', '135');
        markL.setAttribute('rx', '12');
        markL.setAttribute('ry', '6');
        markL.setAttribute('fill', '#5c0000');
        markL.setAttribute('opacity', '0.4');
        corruptionGroup.appendChild(markL);
        
        const markR = document.createElementNS(this.svgNS, 'ellipse');
        markR.setAttribute('cx', '180');
        markR.setAttribute('cy', '135');
        markR.setAttribute('rx', '12');
        markR.setAttribute('ry', '6');
        markR.setAttribute('fill', '#5c0000');
        markR.setAttribute('opacity', '0.4');
        corruptionGroup.appendChild(markR);
        
        this.container.appendChild(corruptionGroup);
        
        // Glow de corruption
        const corruptionGlow = document.createElementNS(this.svgNS, 'g');
        corruptionGlow.setAttribute('id', 'corruption-glow');
        corruptionGlow.setAttribute('opacity', '0');
        
        const glow1 = document.createElementNS(this.svgNS, 'circle');
        glow1.setAttribute('cx', '150');
        glow1.setAttribute('cy', '120');
        glow1.setAttribute('r', '105');
        glow1.setAttribute('fill', 'none');
        glow1.setAttribute('stroke', '#8b0000');
        glow1.setAttribute('stroke-width', '2');
        glow1.setAttribute('opacity', '0.5');
        glow1.setAttribute('filter', 'url(#glow)');
        corruptionGlow.appendChild(glow1);
        
        const glow2 = document.createElementNS(this.svgNS, 'circle');
        glow2.setAttribute('cx', '150');
        glow2.setAttribute('cy', '120');
        glow2.setAttribute('r', '110');
        glow2.setAttribute('fill', 'none');
        glow2.setAttribute('stroke', '#5c0000');
        glow2.setAttribute('stroke-width', '1');
        glow2.setAttribute('opacity', '0.3');
        glow2.setAttribute('filter', 'url(#glow)');
        corruptionGlow.appendChild(glow2);
        
        this.container.appendChild(corruptionGlow);
        
        // Cornes
        const horns = document.createElementNS(this.svgNS, 'g');
        horns.setAttribute('id', 'horns');
        horns.setAttribute('opacity', '0');
        
        const hornL = document.createElementNS(this.svgNS, 'path');
        hornL.setAttribute('d', 'M 110 50 Q 105 25, 110 15');
        hornL.setAttribute('stroke', '#5c0000');
        hornL.setAttribute('stroke-width', '3');
        hornL.setAttribute('fill', 'none');
        hornL.setAttribute('stroke-linecap', 'round');
        horns.appendChild(hornL);
        
        const hornR = document.createElementNS(this.svgNS, 'path');
        hornR.setAttribute('d', 'M 190 50 Q 195 25, 190 15');
        hornR.setAttribute('stroke', '#5c0000');
        hornR.setAttribute('stroke-width', '3');
        hornR.setAttribute('fill', 'none');
        hornR.setAttribute('stroke-linecap', 'round');
        horns.appendChild(hornR);
        
        this.container.appendChild(horns);
    }
}

// Créer une instance globale
const svgBuilder = new SVGBuilder('angelSvg');
