/**
 * ============================================================================
 * WINNER CELEBRATION & CONTINUOUS FIREWORKS ENGINE
 * Launches an initial jackpot fanfare and continuously fires skyrocket bursts,
 * star showers, and side cannons until the winner modal is closed.
 * ============================================================================
 */
import { getActivePalette } from './state.js';

let celebrationTimeouts = [];
let celebrationInterval = null;

export function clearCelebrationTimeouts() {
    celebrationTimeouts.forEach(t => clearTimeout(t));
    celebrationTimeouts = [];

    if (celebrationInterval) {
        clearInterval(celebrationInterval);
        celebrationInterval = null;
    }

    if (typeof confetti === 'function' && typeof confetti.reset === 'function') {
        confetti.reset();
    }
}

export function launchJackpotConfetti(winnerColor) {
    if (typeof confetti !== 'function') return;

    clearCelebrationTimeouts();

    const activeColors = getActivePalette();
    const colors = [
        winnerColor || activeColors[0],
        ...activeColors,
        '#FFD700',
        '#FFFFFF'
    ];

    // 1. Opening Dual Side Cannons
    confetti({
        particleCount: 85,
        angle: 60,
        spread: 68,
        startVelocity: 58,
        origin: { x: 0.04, y: 0.68 },
        colors,
        zIndex: 9999
    });
    confetti({
        particleCount: 85,
        angle: 120,
        spread: 68,
        startVelocity: 58,
        origin: { x: 0.96, y: 0.68 },
        colors,
        zIndex: 9999
    });

    // 2. Center Golden Star Burst (260ms)
    celebrationTimeouts.push(setTimeout(() => {
        confetti({
            particleCount: 70,
            spread: 360,
            ticks: 100,
            gravity: 0.55,
            decay: 0.92,
            startVelocity: 38,
            shapes: ['star'],
            scalar: 1.35,
            origin: { x: 0.5, y: 0.36 },
            colors,
            zIndex: 9999
        });
    }, 260));

    // 3. Twin High Aerial Shells (650ms)
    celebrationTimeouts.push(setTimeout(() => {
        confetti({
            particleCount: 60,
            spread: 360,
            startVelocity: 34,
            ticks: 90,
            origin: { x: 0.22, y: 0.28 },
            colors,
            zIndex: 9999
        });
        confetti({
            particleCount: 60,
            spread: 360,
            startVelocity: 34,
            ticks: 90,
            origin: { x: 0.78, y: 0.28 },
            colors,
            zIndex: 9999
        });
    }, 650));

    // 4. Continuous Looping Fireworks Until Modal Closes
    let burstStep = 0;
    celebrationInterval = setInterval(() => {
        burstStep++;
        const currentPalette = getActivePalette();
        const loopColors = [
            winnerColor || currentPalette[0],
            ...currentPalette,
            '#FFD700',
            '#FFFFFF'
        ];

        if (burstStep % 3 === 1) {
            // Left & Right Skyrocket Shells
            const leftX = 0.12 + Math.random() * 0.22;
            const rightX = 0.66 + Math.random() * 0.22;
            const highY = 0.18 + Math.random() * 0.24;

            confetti({
                particleCount: 48,
                spread: 360,
                startVelocity: 32,
                ticks: 85,
                gravity: 0.65,
                scalar: 1.05,
                origin: { x: leftX, y: highY },
                colors: loopColors,
                zIndex: 9999
            });
            confetti({
                particleCount: 48,
                spread: 360,
                startVelocity: 32,
                ticks: 85,
                gravity: 0.65,
                scalar: 1.05,
                origin: { x: rightX, y: highY },
                colors: loopColors,
                zIndex: 9999
            });
        } else if (burstStep % 3 === 2) {
            // Golden Star & Circle Aerial Burst Above Modal
            confetti({
                particleCount: 52,
                spread: 360,
                startVelocity: 30,
                ticks: 95,
                gravity: 0.55,
                shapes: ['star', 'circle'],
                scalar: 1.25,
                origin: {
                    x: 0.3 + Math.random() * 0.4,
                    y: 0.16 + Math.random() * 0.18
                },
                colors: loopColors,
                zIndex: 9999
            });
        } else {
            // Dual Side Arcade Cannons
            confetti({
                particleCount: 42,
                angle: 58,
                spread: 55,
                startVelocity: 50,
                origin: { x: 0.02, y: 0.72 },
                colors: loopColors,
                zIndex: 9999
            });
            confetti({
                particleCount: 42,
                angle: 122,
                spread: 55,
                startVelocity: 50,
                origin: { x: 0.98, y: 0.72 },
                colors: loopColors,
                zIndex: 9999
            });
        }
    }, 820);
}
