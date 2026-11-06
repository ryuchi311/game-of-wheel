/**
 * ============================================================================
 * PROCEDURAL MULTI-THEME SOUND & BACKGROUND MUSIC ENGINE (TONE.JS)
 * ============================================================================
 */
import { SCALE_NOTES, BGM_PATTERNS } from './config.js';
import { state } from './state.js';

class SoundEngine {
    constructor() {
        this.initialized = false;
        this.tickStep = 0;
        this.bgmStep = 0;
        this.bgmInterval = null;
        this.woodSynth = null;
        this.bellSynth = null;
        this.cyberSynth = null;
        this.retroSynth = null;
        this.subSynth = null;
        this.winSynth = null;
        this.bgmBassSynth = null;
        this.bgmPadSynth = null;
        this.bgmLeadSynth = null;
    }

    async init() {
        if (this.initialized) return;
        try {
            await Tone.start();

            // 1. Crisp percussive peg click / woodblock
            this.woodSynth = new Tone.MembraneSynth({
                pitchDecay: 0.012,
                octaves: 2.5,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 0.045,
                    sustain: 0,
                    release: 0.02
                }
            }).toDestination();
            this.woodSynth.volume.value = -8;

            // 2. Melodic FM Marimba / Chime Bell synth for musical ticks
            this.bellSynth = new Tone.PolySynth(Tone.FMSynth, {
                harmonicity: 3,
                modulationIndex: 8,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 0.14,
                    sustain: 0,
                    release: 0.08
                },
                modulation: { type: 'triangle' },
                modulationEnvelope: {
                    attack: 0.001,
                    decay: 0.08,
                    sustain: 0,
                    release: 0.04
                }
            }).toDestination();
            this.bellSynth.volume.value = -9;

            // 3. Futuristic Cyber Synth for sci-fi ticks
            this.cyberSynth = new Tone.Synth({
                oscillator: { type: 'sawtooth' },
                envelope: {
                    attack: 0.002,
                    decay: 0.07,
                    sustain: 0,
                    release: 0.04
                }
            }).toDestination();
            this.cyberSynth.volume.value = -13;

            // 4. 8-Bit Square Wave Retro Synth
            this.retroSynth = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: {
                    attack: 0.001,
                    decay: 0.06,
                    sustain: 0,
                    release: 0.02
                }
            }).toDestination();
            this.retroSynth.volume.value = -14;

            // 5. Deep Sub-Bass Impact for dramatic lock-in & launch
            this.subSynth = new Tone.MembraneSynth({
                pitchDecay: 0.06,
                octaves: 4,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.002,
                    decay: 0.35,
                    sustain: 0,
                    release: 0.18
                }
            }).toDestination();
            this.subSynth.volume.value = -5;

            // 6. Rich Polyphonic Brass/Chime Synth for Victory Fanfares
            this.winSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle8' },
                envelope: {
                    attack: 0.015,
                    decay: 0.35,
                    sustain: 0.25,
                    release: 0.9
                }
            }).toDestination();
            this.winSynth.volume.value = -5;

            // 7. Background Music Synths (Bass, Chord Pad, Melody Lead)
            this.bgmBassSynth = new Tone.Synth({
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.01, decay: 0.18, sustain: 0.1, release: 0.15 }
            }).toDestination();
            this.bgmBassSynth.volume.value = -15;

            this.bgmPadSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.04, decay: 0.3, sustain: 0.25, release: 0.5 }
            }).toDestination();
            this.bgmPadSynth.volume.value = -20;

            this.bgmLeadSynth = new Tone.Synth({
                oscillator: { type: 'amsine' },
                envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.2 }
            }).toDestination();
            this.bgmLeadSynth.volume.value = -16;

            this.initialized = true;
        } catch (err) {
            console.warn('Audio initialization skipped:', err);
        }
    }

    async startBGM() {
        await this.init();
        this.stopBGM();
        if (!state.bgmEnabled || state.bgmTrack === 'off') return;

        const pattern = BGM_PATTERNS[state.bgmTrack] || BGM_PATTERNS.showtime;
        // 8th-note step duration in ms
        const stepMs = Math.round((60 / pattern.bpm) * 500);
        this.bgmStep = 0;

        this.bgmInterval = setInterval(() => {
            if (!state.bgmEnabled || !this.initialized) return;
            try {
                const p = BGM_PATTERNS[state.bgmTrack] || BGM_PATTERNS.showtime;
                const idx = this.bgmStep % 16;
                const chordIdx = this.bgmStep % p.chords.length;

                const bassNote = p.bass[idx];
                if (bassNote) {
                    this.bgmBassSynth.triggerAttackRelease(bassNote, '16n');
                }

                const chord = p.chords[chordIdx];
                if (chord) {
                    this.bgmPadSynth.triggerAttackRelease(chord, '4n');
                }

                const leadNote = p.lead[idx];
                if (leadNote) {
                    this.bgmLeadSynth.triggerAttackRelease(leadNote, '16n');
                }

                this.bgmStep++;
            } catch (e) {}
        }, stepMs);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    playSpinStart() {
        if (!state.soundEnabled || !this.initialized) return;
        try {
            const now = Tone.now();
            this.tickStep = 0;
            const launchNotes = ['C4', 'G4', 'C5', 'E5'];
            launchNotes.forEach((n, idx) => {
                this.bellSynth.triggerAttackRelease(n, '32n', now + idx * 0.035, 0.7);
            });
            this.subSynth.triggerAttackRelease('C2', '16n', now);
        } catch (e) {}
    }

    playTick(speedRatio = 1) {
        if (!state.soundEnabled || !this.initialized) return;
        try {
            const theme = state.soundTheme || 'arcade';
            const scale = SCALE_NOTES[theme] || SCALE_NOTES.arcade;
            const noteIdx = (speedRatio > 0.22)
                ? (this.tickStep++ % scale.length)
                : Math.max(0, Math.floor(speedRatio * 4.5 * scale.length) % scale.length);
            const note = scale[noteIdx];

            if (theme === 'arcade') {
                this.bellSynth.triggerAttackRelease(note, '32n', undefined, 0.75);
                this.woodSynth.triggerAttackRelease(speedRatio > 0.3 ? 'G3' : 'D3', '32n');
            } else if (theme === 'casino') {
                const clickPitch = speedRatio > 0.5 ? 'A4' : (speedRatio > 0.2 ? 'F4' : 'C4');
                this.woodSynth.triggerAttackRelease(clickPitch, '32n');
                if (speedRatio < 0.35 || this.tickStep % 2 === 0) {
                    this.bellSynth.triggerAttackRelease(note, '64n', undefined, 0.45);
                }
            } else if (theme === 'marimba') {
                this.bellSynth.triggerAttackRelease(note, '16n', undefined, 0.9);
            } else if (theme === 'cyber') {
                this.cyberSynth.triggerAttackRelease(note, '32n');
                this.woodSynth.triggerAttackRelease('C3', '32n');
            } else if (theme === 'retro') {
                this.retroSynth.triggerAttackRelease(note, '32n');
            } else if (theme === 'crystal') {
                this.bellSynth.triggerAttackRelease(note, '16n', undefined, 0.85);
            }
        } catch (e) {
            // Ignore rapid trigger collisions
        }
    }

    playSuspenseHeartbeat() {
        if (!state.soundEnabled || !this.initialized) return;
        try {
            const now = Tone.now();
            this.subSynth.triggerAttackRelease('G1', '16n', now);
            this.subSynth.triggerAttackRelease('C2', '8n', now + 0.14);
            this.bellSynth.triggerAttackRelease(['G5', 'C6'], '16n', now + 0.02, 0.8);
        } catch (e) {}
    }

    playWinFanfare() {
        if (!state.soundEnabled || !this.initialized || !this.winSynth) return;
        try {
            const now = Tone.now();
            const theme = state.soundTheme || 'arcade';

            if (theme === 'cyber') {
                this.winSynth.triggerAttackRelease(['A3', 'E4', 'A4', 'C5'], '16n', now);
                this.winSynth.triggerAttackRelease(['F3', 'C4', 'F4', 'A4'], '16n', now + 0.13);
                this.winSynth.triggerAttackRelease(['G3', 'D4', 'G4', 'B4'], '16n', now + 0.26);
                this.winSynth.triggerAttackRelease(['A3', 'E4', 'A4', 'C#5', 'E5', 'A5'], '2n', now + 0.40);
                this.bellSynth.triggerAttackRelease(['E6', 'A6'], '4n', now + 0.42);
            } else if (theme === 'retro') {
                // 8-Bit Arcade Level Clear Arpeggio
                ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6', 'G6'].forEach((n, idx) => {
                    this.retroSynth.triggerAttackRelease(n, '16n', now + idx * 0.065);
                });
                this.winSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '2n', now + 0.52);
            } else {
                this.winSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '16n', now);
                this.winSynth.triggerAttackRelease(['D4', 'F4', 'A4', 'D5'], '16n', now + 0.11);
                this.winSynth.triggerAttackRelease(['E4', 'G4', 'B4', 'E5'], '16n', now + 0.22);
                this.winSynth.triggerAttackRelease(['C4', 'G4', 'C5', 'E5', 'G5', 'C6'], '2n', now + 0.35);

                ['C6', 'E6', 'G6', 'C7'].forEach((n, idx) => {
                    this.bellSynth.triggerAttackRelease(n, '16n', now + 0.36 + idx * 0.06, 0.65);
                });
            }
            this.subSynth.triggerAttackRelease('C2', '4n', now + 0.35);
        } catch (e) {
            console.warn(e);
        }
    }
}

export const soundEngine = new SoundEngine();

