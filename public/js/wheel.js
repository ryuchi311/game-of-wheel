/**
 * ============================================================================
 * CANVAS RESIZING & WHEEL GEOMETRY RENDERING
 * ============================================================================
 */
import { VIBRANT_PALETTE } from './config.js';
import { state } from './state.js';

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
 * Renders the complete wheel, outer casino rim, pegs, text labels, and top pointer
 */
export function drawWheel() {
    const width = wheelWrapper.clientWidth;
    const height = wheelWrapper.clientHeight;
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const outerRadius = Math.min(cx, cy) - 18; // Leave room for top pointer
    const wheelRadius = outerRadius - 14;
    const count = state.options.length;

    if (count === 0) return;
    const arc = (Math.PI * 2) / count;

    // 1. Draw Outer Metallic Bezel / Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(0, 0, width, height);
    rimGrad.addColorStop(0, '#334155');
    rimGrad.addColorStop(0.5, '#0f172a');
    rimGrad.addColorStop(1, '#475569');
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#fbbf24';
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

        // Slice Wedge
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = option.color || VIBRANT_PALETTE[i % VIBRANT_PALETTE.length];
        ctx.fill();

        // Dramatic Spotlight Highlight on active slice during final suspense or reveal
        if (i === activeSliceIdx && (state.suspenseIntensity > 0.1 || state.isRevealingWinner)) {
            const glowAlpha = state.isRevealingWinner
                ? 0.28 + 0.15 * Math.sin(Date.now() / 60)
                : state.suspenseIntensity * 0.25;
            ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
            ctx.fill();
        }

        // Crisp Divider Line
        ctx.lineWidth = (i === activeSliceIdx && state.isRevealingWinner) ? 3.5 : 2;
        ctx.strokeStyle = (i === activeSliceIdx && state.isRevealingWinner)
            ? '#fde047'
            : 'rgba(255, 255, 255, 0.35)';
        ctx.stroke();

        // Slice Label Text
        ctx.save();
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';

        // Dynamic font scaling based on slice count and wheel size
        const baseFontSize = Math.max(10, Math.min(18, (wheelRadius * 0.11) - (count * 0.25)));
        ctx.font = `700 ${baseFontSize}px Fredoka, Inter, sans-serif`;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        const maxTextWidth = wheelRadius * 0.62;
        let label = option.text;
        if (ctx.measureText(label).width > maxTextWidth) {
            while (label.length > 3 && ctx.measureText(label + '…').width > maxTextWidth) {
                label = label.slice(0, -1);
            }
            label += '…';
        }

        ctx.fillText(label, wheelRadius - 18, 0);
        ctx.restore();
    }

    // 3. Draw Outer Rim Light Bulbs & Divider Pegs
    for (let i = 0; i < count; i++) {
        const pegAngle = i * arc;
        const midAngle = pegAngle + arc / 2;

        // Glowing Bulb on the outer rim
        const bx = Math.cos(midAngle) * (wheelRadius + 7);
        const by = Math.sin(midAngle) * (wheelRadius + 7);
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        const blinkRate = state.isRevealingWinner ? 65 : (state.suspenseIntensity > 0.3 ? 110 : 250);
        const isLit = Math.floor(Date.now() / blinkRate + i) % 2 === 0;
        ctx.fillStyle = isLit ? '#fef08a' : '#ca8a04';
        ctx.fill();

        // Metallic Peg at slice boundary
        const px = Math.cos(pegAngle) * (wheelRadius - 2);
        const py = Math.sin(pegAngle) * (wheelRadius - 2);
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
    }

    // 4. Inner Shadow Ring for Depth
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.stroke();

    ctx.restore();

    // 5. Draw Top Bouncing Pointer (Flapper at 12 o'clock)
    ctx.save();
    ctx.translate(cx, cy - outerRadius + 4);
    ctx.rotate(state.pointerAngle);

    // Pointer Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Flapper Triangle Body
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(14, -10);
    ctx.lineTo(0, 28);
    ctx.closePath();
    const pointerGrad = ctx.createLinearGradient(0, -10, 0, 28);
    pointerGrad.addColorStop(0, '#f43f5e');
    pointerGrad.addColorStop(1, '#be123c');
    ctx.fillStyle = pointerGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#fde047';
    ctx.stroke();

    // Pointer Pivot Cap
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    ctx.restore();
}

