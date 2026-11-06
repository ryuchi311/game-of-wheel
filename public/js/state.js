/**
 * ============================================================================
 * GAME OF WHEEL - APPLICATION STATE & PERSISTENT STORAGE
 * ============================================================================
 */
import { PRESETS } from './config.js';

const STORAGE_KEY_HISTORY = 'gow_saved_winners_v1';
const STORAGE_KEY_OPTIONS = 'gow_saved_options_v1';

export const state = {
    options: JSON.parse(JSON.stringify(PRESETS.prizes)),
    history: [],
    isSpinning: false,
    isIdleMoving: true,    // Gentle continuous rotation before first spin (or when idle)
    idleSpeed: 0.0035,     // Slow ambient rotation speed in radians/frame
    lastFrameTime: 0,
    soundEnabled: true,
    soundTheme: 'arcade',  // 'arcade' | 'casino' | 'marimba' | 'cyber' | 'retro' | 'crystal'
    bgmEnabled: false,
    bgmTrack: 'showtime',  // 'showtime' | 'synthwave' | 'chill' | 'suspense'
    currentAngle: 0,       // Current wheel rotation in radians
    angularVelocity: 0,    // Current speed in rad/s
    pointerAngle: 0,       // Deflection angle of the top flapper (radians)
    pointerVelocity: 0,    // Angular velocity of the flapper spring
    lastSegmentIndex: -1,  // Tracks peg crossings for tick sounds
    lastWinnerIndex: null, // Index of the most recent winner
    spinStartTime: 0,
    spinDuration: 5000,    // Default 5 seconds
    startAngle: 0,
    targetAngle: 0,
    isRevealingWinner: false, // Brief dramatic spotlight pause after wheel stops
    revealStartTime: 0,
    suspenseIntensity: 0,  // 0..1 intensity during the final crawl

    // Wheel Canvas Target Refresh Rate: 60 | 30
    wheelFps: 60,

    // Spin Modifiers & Atmosphere Checkboxes
    modes: {
        dramatic: true,    // Slow-motion heartbeat crawl & spotlight zoom
        intense: false,    // High-speed siren alarm & heavy screen glow
        thrill: false,     // Last-millimeter near-miss fake-out crawl
        surprise: false,   // Reverse direction fake-out near finish
        panic: false,      // Aggressive screen shake & rapid warning tick
        funny: false       // Boing, slide whistle, wobble & comic winner captions
    }
};

export function saveStateToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(state.history));
        localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(state.options));
    } catch (e) {
        console.warn('Could not save state to localStorage:', e);
    }
}

export function loadStateFromStorage() {
    try {
        const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (savedHistory) {
            const parsedH = JSON.parse(savedHistory);
            if (Array.isArray(parsedH)) state.history = parsedH;
        }
        const savedOptions = localStorage.getItem(STORAGE_KEY_OPTIONS);
        if (savedOptions) {
            const parsedO = JSON.parse(savedOptions);
            if (Array.isArray(parsedO) && parsedO.length >= 2) {
                state.options = parsedO;
            }
        }
    } catch (e) {
        console.warn('Could not load state from localStorage:', e);
    }
}

