/**
 * ============================================================================
 * GAME OF WHEEL - CONSTANTS, CURATED PALETTE THEMES & PRESETS
 * ============================================================================
 */
export const THEMES = {
    sunset: {
        id: 'sunset',
        name: 'Sunset Bloom',
        subtitle: 'Tangerine, Rose & Lilac',
        colors: ['#FF7602', '#FF69A4', '#F13B37', '#8BBBE0', '#D09EE5', '#D19586'],
        accent1: '#FF7602',
        accent2: '#FF69A4',
        accent3: '#D09EE5',
        accent4: '#8BBBE0',
        bgBase: '#131122',
        bgPanel: 'rgba(27, 24, 48, 0.88)'
    },
    tropical: {
        id: 'tropical',
        name: 'Tropical Citrus',
        subtitle: 'Sunburst Gold, Teal & Coral',
        colors: ['#FFD600', '#00A8A7', '#DFE9E4', '#FE6538', '#FFDFCC'],
        accent1: '#FE6538',
        accent2: '#FFD600',
        accent3: '#00A8A7',
        accent4: '#FFDFCC',
        bgBase: '#0E1924',
        bgPanel: 'rgba(20, 34, 48, 0.88)'
    },
    sorbet: {
        id: 'sorbet',
        name: 'Coastal Sorbet',
        subtitle: 'Mint, Peach, Sage & Sky',
        colors: ['#A6EFE7', '#FFA69F', '#DBEDCE', '#76B8CE', '#FFE9B9'],
        accent1: '#76B8CE',
        accent2: '#FFA69F',
        accent3: '#A6EFE7',
        accent4: '#FFE9B9',
        bgBase: '#101A28',
        bgPanel: 'rgba(22, 35, 52, 0.88)'
    },
    nordic: {
        id: 'nordic',
        name: 'NordicPop',
        subtitle: 'Slate, Vivid Orange, Gold & Petrol',
        colors: ['#6E7E86', '#E8E8E8', '#FF6816', '#FCD800', '#00799B'],
        accent1: '#FF6816',
        accent2: '#FCD800',
        accent3: '#00799B',
        accent4: '#E8E8E8',
        bgBase: '#0F1724',
        bgPanel: 'rgba(21, 32, 48, 0.88)'
    },
    velvet: {
        id: 'velvet',
        name: 'Velvet Rose',
        subtitle: 'Berry, Apricot, Mint & Mauve',
        colors: ['#BC5377', '#FFB8B0', '#C9EEE1', '#7B7986', '#E992A1'],
        accent1: '#BC5377',
        accent2: '#E992A1',
        accent3: '#C9EEE1',
        accent4: '#FFB8B0',
        bgBase: '#181122',
        bgPanel: 'rgba(33, 24, 46, 0.88)'
    },
    pastel: {
        id: 'pastel',
        name: 'Pastel Dream',
        subtitle: 'Lemon, Orchid, Periwinkle & Peach',
        colors: ['#FFF6A3', '#FFC7F8', '#B2D4FF', '#D9FED7', '#FFBFB0'],
        accent1: '#B2D4FF',
        accent2: '#FFC7F8',
        accent3: '#FFF6A3',
        accent4: '#D9FED7',
        bgBase: '#131426',
        bgPanel: 'rgba(26, 28, 52, 0.88)'
    },
    crimson: {
        id: 'crimson',
        name: 'Crimson Tide',
        subtitle: 'Ocean Teal, Ice Mint, Coral & Peach',
        colors: ['#4599AA', '#E8E8E8', '#E5F7ED', '#FC3848', '#FDAF8C'],
        accent1: '#FC3848',
        accent2: '#FDAF8C',
        accent3: '#4599AA',
        accent4: '#E5F7ED',
        bgBase: '#101826',
        bgPanel: 'rgba(22, 33, 50, 0.88)'
    },
    studio: {
        id: 'studio',
        name: 'Arcade Royal',
        subtitle: 'Sky Blue, Emerald, Gold, Coral & Violet',
        colors: ['#2697F0', '#22C55E', '#FF9912', '#F43F5E', '#A855F7', '#06B6D4'],
        accent1: '#2697F0',
        accent2: '#A855F7',
        accent3: '#FF9912',
        accent4: '#22C55E',
        bgBase: '#11152B',
        bgPanel: 'rgba(24, 30, 58, 0.88)'
    }
};

export const VIBRANT_PALETTE = THEMES.sunset.colors;

export const PRESETS = {
    prizes: [
        { text: 'Grand Prize ($1,000)', color: '#FF7602' },
        { text: 'Mystery Collector Box', color: '#FF69A4' },
        { text: 'VIP All-Access Pass', color: '#F13B37' },
        { text: 'Team Dinner Voucher', color: '#8BBBE0' },
        { text: 'Studio Headphones', color: '#D09EE5' },
        { text: 'Specialty Coffee Card', color: '#D19586' },
        { text: 'Double Score Multiplier', color: '#FF7602' },
        { text: 'Bonus Respin Token', color: '#FF69A4' }
    ],
    dinner: [
        { text: 'Neapolitan Pizza', color: '#F13B37' },
        { text: 'Sushi & Tonkotsu Ramen', color: '#8BBBE0' },
        { text: 'Birria Street Tacos', color: '#FF7602' },
        { text: 'Dry-Aged Smash Burgers', color: '#D19586' },
        { text: 'Mediterranean Mezze', color: '#D09EE5' },
        { text: 'Pad Kee Mao Noodles', color: '#FF69A4' }
    ],
    truth: [
        { text: 'Sing a 15-Second Hook', color: '#FF69A4' },
        { text: 'Freestyle Dance Challenge', color: '#D09EE5' },
        { text: 'Tell Your Best Story', color: '#FF7602' },
        { text: 'Voice Impression Round', color: '#8BBBE0' },
        { text: 'Share an Unpopular Opinion', color: '#F13B37' },
        { text: 'Nominate the Next Player', color: '#D19586' }
    ],
    numbers: Array.from({ length: 8 }, (_, i) => ({
        text: `Selection 0${i + 1}`,
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
