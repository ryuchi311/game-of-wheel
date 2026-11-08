/**
 * ============================================================================
 * CANVAS RESIZING & WHEEL GEOMETRY RENDERING
 * Adapts dynamically to the active Palette Theme & auto-calculates text contrast.
 * ============================================================================
 */
import { THEMES } from './config.js';
import { state, getActivePalette } from './state.js';

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const wheelWrapper = document.getElementById('wheelWrapper');

export function resizeCanvas() {
    const rect = wheelWrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel();
}

/**
 * Computes WCAG relative luminance of a hex color to pick dark vs light text
 */
export function isLightHexColor(hex) {
    if (!hex || typeof hex !== 'string') return false;
    const clean = hex.replace('#', '').trim();
    if (clean.length !== 6) return false;
    const sRGB = [
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255
    ].map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    const lum = 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    return lum > 0.36;
}

/**
 * Computes which slice index is currently under the top pointer (12 o'clock = -PI/2)
 */
export function getWinningSliceIndex(angle) {
    const count = state.options.length;
    if (count === 0) return -1;
    const arc = (Math.PI * 2) / count;
    // Pointer is located at 12 o'clock (3*PI/2 or -PI/2 in standard canvas coordinates)
    const pointerPos = (Math.PI * 1.5 - (angle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2);
    return Math.floor(pointerPos / arc) % count;
}

/**
 * Renders the wheel, outer bezel, rim lights, boundary pegs, and pointer
 */
export function drawWheel() {
    const width = wheelWrapper.clientWidth;
    const height = wheelWrapper.clientHeight;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) - 16; // Leave room for top pointer
    const wheelRadius = outerRadius - 13;
    const count = state.options.length;

    if (count === 0) return;
    const arc = (Math.PI * 2) / count;

    const activeTheme = THEMES[state.theme] || THEMES.sunset;
    const palette = getActivePalette();

    // 1. Draw Outer Bezel / Rim (Professional Metallic Game Bezel)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(0, 0, width, height);
    rimGrad.addColorStop(0, '#2A2546');
    rimGrad.addColorStop(0.5, activeTheme.bgBase || '#131122');
    rimGrad.addColorStop(1, '#19162D');
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Crisp outer rim stroke with active theme gradient
    const strokeGrad = ctx.createLinearGradient(0, 0, width, height);
    strokeGrad.addColorStop(0, activeTheme.accent1);
    strokeGrad.addColorStop(0.5, activeTheme.accent2);
    strokeGrad.addColorStop(1, activeTheme.accent3);
    ctx.lineWidth = 3;
    ctx.strokeStyle = strokeGrad;
    ctx.stroke();
    ctx.restore();

    // 2. Draw Rotating Wheel Slices
    const activeSliceIdx = getWinningSliceIndex(state.currentAngle);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.currentAngle);

    for (let i = 0; i < count; i++) {
        const startAngle = i * arc;
        const endAngle = startAngle + arc;
        const option = state.options[i];
        const sliceColor = option.color || palette[i % palette.length];

        // Slice Wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = sliceColor;
        ctx.fill();

        // Subtle Satin Sheen so pastel and vibrant slices alike feel dimensional
        const wedgeGrad = ctx.createRadialGradient(0, 0, wheelRadius * 0.1, 0, 0, wheelRadius);
        wedgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        wedgeGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        wedgeGrad.addColorStop(1, 'rgba(15, 14, 23, 0.14)');
        ctx.fillStyle = wedgeGrad;
        ctx.fill();

        // Spotlight Highlight on active slice during final suspense or reveal
        if (i === activeSliceIdx && (state.suspenseIntensity > 0.1 || state.isRevealingWinner)) {
            const glowAlpha = state.isRevealingWinner
                ? 0.28 + 0.14 * Math.sin(Date.now() / 65)
                : state.suspenseIntensity * 0.24;
            ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
            ctx.fill();
        }

        // Crisp Slice Divider
        ctx.lineWidth = (i === activeSliceIdx && state.isRevealingWinner) ? 3 : 1.85;
        ctx.strokeStyle = (i === activeSliceIdx && state.isRevealingWinner)
            ? '#FFFFFF'
            : 'rgba(19, 17, 34, 0.78)';
        ctx.stroke();

        // Slice Label Text (Auto-contrasted for light pastel slices vs deep vibrant slices)
        const useDarkText = isLightHexColor(sliceColor);
        ctx.save();
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = useDarkText ? '#0F172A' : '#FFFFFF';

        const baseFontSize = Math.max(11, Math.min(16, (wheelRadius * 0.095) - (count * 0.18)));
        ctx.font = `700 ${baseFontSize}px "Plus Jakarta Sans", Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.shadowColor = useDarkText ? 'rgba(255, 255, 255, 0.5)' : 'rgba(15, 14, 23, 0.7)';
        ctx.shadowBlur = useDarkText ? 1 : 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        const maxTextWidth = wheelRadius * 0.60;
        let label = option.text;
        if (ctx.measureText(label).width > maxTextWidth) {
            while (label.length > 3 && ctx.measureText(label + '…').width > maxTextWidth) {
                label = label.slice(0, -1);
            }
            label += '…';
        }

        ctx.fillText(label, wheelRadius - 20, 0);
        ctx.restore();
    }

    // 3. Draw Bezel Accent Lights & Polished Boundary Pegs
    for (let i = 0; i < count; i++) {
        const pegAngle = i * arc;
        const midAngle = pegAngle + arc / 2;

        // Bezel Accent Dot cycling through the active theme highlights
        const bx = Math.cos(midAngle) * (wheelRadius + 6.5);
        const by = Math.sin(midAngle) * (wheelRadius + 6.5);
        ctx.beginPath();
        ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
        const isLit = Math.floor(Date.now() / (state.isSpinning ? 140 : 450) + i) % 2 === 0;
        ctx.fillStyle = isLit ? activeTheme.accent1 : 'rgba(255, 255, 255, 0.45)';
        ctx.fill();

        // Pearl-White Boundary Peg
        const px = Math.cos(pegAngle) * (wheelRadius - 1.5);
        const py = Math.sin(pegAngle) * (wheelRadius - 1.5);
        ctx.beginPath();
        ctx.arc(px, py, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = activeTheme.bgBase || '#131122';
        ctx.stroke();
    }

    // 4. Inner Rim Highlight Ring
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    ctx.restore();

    // 5. Draw Top Pointer (12 o'clock 3D Tactile Flapper)
    ctx.save();
    ctx.translate(cx, cy - outerRadius + 3);
    ctx.rotate(state.pointerAngle);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(-13, -9);
    ctx.lineTo(13, -9);
    ctx.lineTo(0, 25);
    ctx.closePath();
    const pointerGrad = ctx.createLinearGradient(0, -9, 0, 25);
    pointerGrad.addColorStop(0, activeTheme.accent1);
    pointerGrad.addColorStop(1, activeTheme.accent2);
    ctx.fillStyle = pointerGrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Center Pivot Pin
    ctx.beginPath();
    ctx.arc(0, -3.5, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();
}
