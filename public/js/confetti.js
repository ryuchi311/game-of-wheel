/**
 * ============================================================================
 * WINNER CELEBRATION & CONFETTI FIREWORKS
 * ============================================================================
 */
let celebrationTimeouts = [];

export function clearCelebrationTimeouts() {
    celebrationTimeouts.forEach(t => clearTimeout(t));
    celebrationTimeouts = [];
}

export function launchJackpotConfetti(winnerColor) {
    if (typeof confetti !== 'function') return;

    clearCelebrationTimeouts();

    const colors = [winnerColor || '#F59E0B', '#FBBF24', '#EC4899', '#38BDF8', '#A855F7', '#10B981', '#FFFFFF'];

    // 1. Immediate Dual Side Cannons
    confetti({
        particleCount: 90,
        angle: 60,
        spread: 70,
        startVelocity: 55,
        origin: { x: 0.05, y: 0.65 },
        colors,
        zIndex: 9999
    });
    confetti({
        particleCount: 90,
        angle: 120,
        spread: 70,
        startVelocity: 55,
        origin: { x: 0.95, y: 0.65 },
        colors,
        zIndex: 9999
    });

    // 2. Center Golden Star Burst (300ms)
    celebrationTimeouts.push(setTimeout(() => {
        confetti({
            particleCount: 70,
            spread: 360,
            ticks: 90,
            gravity: 0.6,
            decay: 0.92,
            startVelocity: 38,
            shapes: ['star'],
            scalar: 1.35,
            origin: { x: 0.5, y: 0.42 },
            colors: ['#FDE047', '#F59E0B', '#FFFBEB', winnerColor || '#EC4899'],
            zIndex: 9999
        });
    }, 300));

    // 3. Secondary High Fireworks Salvo (700ms & 1150ms)
    celebrationTimeouts.push(setTimeout(() => {
        confetti({
            particleCount: 65,
            spread: 110,
            startVelocity: 45,
            origin: { x: 0.25, y: 0.35 },
            colors,
            zIndex: 9999
        });
        confetti({
            particleCount: 65,
            spread: 110,
            startVelocity: 45,
            origin: { x: 0.75, y: 0.35 },
            colors,
            zIndex: 9999
        });
    }, 720));

    celebrationTimeouts.push(setTimeout(() => {
        confetti({
            particleCount: 85,
            spread: 140,
            startVelocity: 42,
            scalar: 1.15,
            origin: { x: 0.5, y: 0.3 },
            colors,
            zIndex: 9999
        });
    }, 1150));
}

