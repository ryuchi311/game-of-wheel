/**
 * ============================================================================
 * GAME OF WHEEL - CONSTANTS & PRESETS CONFIGURATION
 * ============================================================================
 */
export const VIBRANT_PALETTE = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#6366F1'  // Indigo
];

export const PRESETS = {
    prizes: [
        { text: '💎 $1,000 Jackpot', color: '#F59E0B' },
        { text: '🎁 Mystery Box', color: '#8B5CF6' },
        { text: '🎟️ Free Spin', color: '#10B981' },
        { text: '🍕 Free Pizza', color: '#EF4444' },
        { text: '🎧 Wireless Earbuds', color: '#3B82F6' },
        { text: '☕ Coffee Gift Card', color: '#EC4899' },
        { text: '🚀 2x Multiplier', color: '#06B6D4' },
        { text: '😅 Try Again!', color: '#6366F1' }
    ],
    dinner: [
        { text: '🍕 Woodfired Pizza', color: '#EF4444' },
        { text: '🍣 Sushi & Ramen', color: '#EC4899' },
        { text: '🌮 Street Tacos', color: '#F59E0B' },
        { text: '🍔 Smash Burgers', color: '#F97316' },
        { text: '🥗 Mediterranean Bowl', color: '#10B981' },
        { text: '🍝 Thai Curry', color: '#8B5CF6' }
    ],
    truth: [
        { text: '🎤 Sing a Chorus', color: '#EC4899' },
        { text: '🕺 15s Dance Off', color: '#8B5CF6' },
        { text: '😂 Tell a Dad Joke', color: '#F59E0B' },
        { text: '🎭 Imitate Someone', color: '#3B82F6' },
        { text: '🤫 Share a Secret', color: '#10B981' },
        { text: '👑 Skip Your Turn', color: '#06B6D4' }
    ],
    numbers: Array.from({ length: 8 }, (_, i) => ({
        text: `Lucky #${i + 1}`,
        color: VIBRANT_PALETTE[i % VIBRANT_PALETTE.length]
    }))
};

export const SCALE_NOTES = {
    arcade:  ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6'],
    casino:  ['G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5'],
    marimba: ['F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5'],
    cyber:   ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'E6'],
    retro:   ['C5', 'E5', 'G5', 'B5', 'C6', 'E6', 'G6', 'C7'],
    crystal: ['E5', 'G#5', 'B5', 'D#6', 'E6', 'G#6', 'B6', 'E7']
};

export const BGM_PATTERNS = {
    showtime: {
        bpm: 124,
        bass: ['C2', 'C2', 'E2', 'G2', 'A2', 'G2', 'E2', 'G2', 'F2', 'F2', 'A2', 'C3', 'G2', 'G2', 'B2', 'D3'],
        chords: [
            ['C4', 'E4', 'G4', 'B4'], null, ['C4', 'E4', 'G4', 'A4'], null,
            ['F4', 'A4', 'C5', 'E5'], null, ['G4', 'B4', 'D5', 'F5'], null
        ],
        lead: ['E5', null, 'G5', 'A5', 'G5', null, 'E5', 'C5', 'A5', null, 'C6', 'A5', 'G5', 'A5', 'B5', 'D6']
    },
    synthwave: {
        bpm: 112,
        bass: ['A1', 'A2', 'A1', 'A2', 'F1', 'F2', 'F1', 'F2', 'C2', 'C3', 'C2', 'C3', 'G1', 'G2', 'G1', 'G2'],
        chords: [
            ['A3', 'C4', 'E4'], null, null, null,
            ['F3', 'A3', 'C4'], null, null, null,
            ['C4', 'E4', 'G4'], null, null, null,
            ['G3', 'B3', 'D4'], null, null, null
        ],
        lead: ['E5', 'C5', 'A4', 'C5', 'E5', 'A5', 'G5', 'E5', 'F5', 'C5', 'A4', 'C5', 'D5', 'G5', 'F5', 'D5']
    },
    chill: {
        bpm: 92,
        bass: ['D2', null, 'A2', null, 'G2', null, 'D2', null, 'C2', null, 'G2', null, 'F2', null, 'C2', 'A1'],
        chords: [
            ['D4', 'F4', 'A4', 'C5'], null, null, ['G3', 'B3', 'D4', 'F4'],
            ['C4', 'E4', 'G4', 'B4'], null, null, ['F3', 'A3', 'C4', 'E4']
        ],
        lead: [null, 'A5', 'G5', 'F5', null, 'D5', 'F5', 'G5', null, 'G5', 'E5', 'C5', null, 'A4', 'C5', 'E5']
    },
    suspense: {
        bpm: 108,
        bass: ['C2', null, 'C2', 'G1', 'C2', null, 'C2', 'Eb2', 'D2', null, 'D2', 'A1', 'G1', null, 'G1', 'B1'],
        chords: [
            ['C3', 'Eb3', 'G3'], null, null, null,
            ['Ab2', 'C3', 'Eb3'], null, null, null,
            ['F3', 'Ab3', 'C4'], null, null, null,
            ['G2', 'B2', 'D3', 'F3'], null, null, null
        ],
        lead: ['C5', null, null, 'Eb5', 'D5', null, null, 'G4', 'Ab4', null, null, 'C5', 'B4', null, 'D5', 'G5']
    }
};

