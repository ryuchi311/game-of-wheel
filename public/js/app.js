/**
 * ============================================================================
 * GAME OF WHEEL - MAIN APPLICATION CONTROLLER & PHYSICS LOOP
 * ============================================================================
 */
import { VIBRANT_PALETTE, PRESETS } from './config.js';
import { state, saveStateToStorage, loadStateFromStorage } from './state.js';
import { soundEngine } from './sound.js';
import { resizeCanvas, getWinningSliceIndex, drawWheel } from './wheel.js';
import { launchJackpotConfetti, clearCelebrationTimeouts } from './confetti.js';

/**
 * DOM Elements & References
 */
const canvas = document.getElementById('wheelCanvas');
const wheelWrapper = document.getElementById('wheelWrapper');

const mainSpinBtn = document.getElementById('mainSpinBtn');
const centerHubBtn = document.getElementById('centerHubBtn');
const currentSliceLabel = document.getElementById('currentSliceLabel');
const statusIndicator = document.getElementById('statusIndicator');
const spinDurationRange = document.getElementById('spinDurationRange');
const spinDurationInput = document.getElementById('spinDurationInput');
const spinTimePresetBtns = document.querySelectorAll('.spin-time-preset');
const eliminateWinnerToggle = document.getElementById('eliminateWinnerToggle');

const presetSelect = document.getElementById('presetSelect');
const soundThemeSelect = document.getElementById('soundThemeSelect');
const panelSoundThemeSelect = document.getElementById('panelSoundThemeSelect');
const bgmTrackSelect = document.getElementById('bgmTrackSelect');
const panelBgmTrackSelect = document.getElementById('panelBgmTrackSelect');
const bgmToggleBtn = document.getElementById('bgmToggleBtn');
const bgmIcon = document.getElementById('bgmIcon');
const bgmStatusLabel = document.getElementById('bgmStatusLabel');
const panelBgmToggleBtn = document.getElementById('panelBgmToggleBtn');
const panelBgmToggleIcon = document.getElementById('panelBgmToggleIcon');
const panelBgmToggleText = document.getElementById('panelBgmToggleText');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const stageModeBtn = document.getElementById('stageModeBtn');
const stageModeIcon = document.getElementById('stageModeIcon');
const stageModeText = document.getElementById('stageModeText');
const stageWinnersList = document.getElementById('stageWinnersList');

const tabOptionsBtn = document.getElementById('tabOptionsBtn');
const tabHistoryBtn = document.getElementById('tabHistoryBtn');
const optionsTabPanel = document.getElementById('optionsTabPanel');
const historyTabPanel = document.getElementById('historyTabPanel');
const optionCountBadge = document.getElementById('optionCountBadge');
const historyCountBadge = document.getElementById('historyCountBadge');

const addOptionForm = document.getElementById('addOptionForm');
const newOptionInput = document.getElementById('newOptionInput');
const optionsListContainer = document.getElementById('optionsListContainer');
const historyListContainer = document.getElementById('historyListContainer');
const validationToast = document.getElementById('validationToast');
const validationToastText = document.getElementById('validationToastText');

const shuffleOptionsBtn = document.getElementById('shuffleOptionsBtn');
const sortOptionsBtn = document.getElementById('sortOptionsBtn');
const resetOptionsBtn = document.getElementById('resetOptionsBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const copyHistoryBtn = document.getElementById('copyHistoryBtn');
const downloadHistoryBtn = document.getElementById('downloadHistoryBtn');
const leaderboardContainer = document.getElementById('leaderboardContainer');
const leaderboardPills = document.getElementById('leaderboardPills');
const recentWinnersStrip = document.getElementById('recentWinnersStrip');
const viewAllWinnersBtn = document.getElementById('viewAllWinnersBtn');

const bulkPasteToggleBtn = document.getElementById('bulkPasteToggleBtn');
const bulkPasteDrawer = document.getElementById('bulkPasteDrawer');
const closeBulkDrawerBtn = document.getElementById('closeBulkDrawerBtn');
const bulkNamesTextarea = document.getElementById('bulkNamesTextarea');
const bulkCountPreview = document.getElementById('bulkCountPreview');
const bulkAppendBtn = document.getElementById('bulkAppendBtn');
const bulkReplaceBtn = document.getElementById('bulkReplaceBtn');

const winnerModal = document.getElementById('winnerModal');
const modalAmbientGlow = document.getElementById('modalAmbientGlow');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalWinnerBanner = document.getElementById('modalWinnerBanner');
const modalWinnerText = document.getElementById('modalWinnerText');
const modalSpinStats = document.getElementById('modalSpinStats');
const modalRemoveWinnerBtn = document.getElementById('modalRemoveWinnerBtn');
const modalSpinAgainBtn = document.getElementById('modalSpinAgainBtn');

/**
 * Helpers
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showValidationNotice(msg) {
    validationToastText.textContent = msg;
    validationToast.classList.remove('hidden');
    setTimeout(() => {
        validationToast.classList.add('hidden');
    }, 3200);
}

function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

/**
 * ============================================================================
 * PHYSICS & ANIMATION LOOP
 * ============================================================================
 */
function triggerSpin() {
    if (state.isSpinning || state.isRevealingWinner) return;
    if (state.options.length < 2) {
        showValidationNotice('Add at least 2 options on the wheel to spin!');
        return;
    }

    soundEngine.init().then(() => {
        soundEngine.playSpinStart();
    });

    state.isSpinning = true;
    state.isIdleMoving = false;
    state.isRevealingWinner = false;
    state.suspenseIntensity = 0;
    mainSpinBtn.disabled = true;
    centerHubBtn.disabled = true;
    statusIndicator.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping';

    const customSec = parseFloat(spinDurationInput.value);
    const durationSec = (!isNaN(customSec) && customSec >= 1) ? Math.min(300, customSec) : (parseInt(spinDurationRange.value, 10) || 8);
    state.spinDuration = durationSec * 1000;
    state.spinStartTime = performance.now();
    state.startAngle = state.currentAngle;

    // Scale full rotations proportionally with spin duration so longer spins stay energetic
    const baseRotations = Math.max(6, Math.round(durationSec * 1.4));
    const extraSpins = (baseRotations + Math.random() * 4) * Math.PI * 2;
    const randomStopOffset = Math.random() * Math.PI * 2;
    state.targetAngle = state.startAngle + extraSpins + randomStopOffset;

    state.lastSegmentIndex = getWinningSliceIndex(state.currentAngle);
}

function updatePhysics(now) {
    if (state.isSpinning) {
        const elapsed = now - state.spinStartTime;
        const progress = Math.min(1, elapsed / state.spinDuration);
        const eased = easeOutQuart(progress);

        const prevAngle = state.currentAngle;
        state.currentAngle = state.startAngle + (state.targetAngle - state.startAngle) * eased;
        const deltaAngle = state.currentAngle - prevAngle;

        // Track suspense intensity during the final 35% of the spin
        state.suspenseIntensity = progress > 0.65 ? (progress - 0.65) / 0.35 : 0;

        // Dynamic camera zoom & glow intensification on the wheel wrapper during final suspense
        if (state.suspenseIntensity > 0) {
            const scale = 1 + state.suspenseIntensity * 0.045;
            const glowPx = Math.round(35 + state.suspenseIntensity * 35);
            wheelWrapper.style.transform = `scale(${scale.toFixed(4)})`;
            wheelWrapper.style.filter = `drop-shadow(0 0 ${glowPx}px rgba(245, 158, 11, ${(0.35 + state.suspenseIntensity * 0.4).toFixed(2)}))`;
        }

        // Check if a slice boundary passed under the 12 o'clock pointer
        const currentSliceIdx = getWinningSliceIndex(state.currentAngle);
        if (currentSliceIdx !== -1 && currentSliceIdx !== state.lastSegmentIndex) {
            state.lastSegmentIndex = currentSliceIdx;
            
            // Deflect the pointer flapper when hit by a peg
            const speedFactor = Math.min(1, deltaAngle * 14);
            state.pointerAngle = -0.45 * Math.max(0.35, speedFactor);
            
            // Play peg tick sound
            soundEngine.playTick(1 - progress);

            // Update live status banner with suspenseful messaging
            const activeOption = state.options[currentSliceIdx];
            if (activeOption) {
                if (progress > 0.78) {
                    currentSliceLabel.innerHTML = `<span class="text-amber-300 font-semibold animate-pulse">Wait for it... ${escapeHtml(activeOption.text)}?</span>`;
                } else if (progress > 0.55) {
                    currentSliceLabel.innerHTML = `Slowing down... <span class="text-white font-semibold">${escapeHtml(activeOption.text)}</span>`;
                } else {
                    currentSliceLabel.textContent = `Spinning... ${activeOption.text}`;
                }
            }
        }

        // Finish Spin -> Enter brief dramatic spotlight reveal before opening modal
        if (progress >= 1) {
            state.isSpinning = false;
            state.currentAngle = ((state.targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            state.isRevealingWinner = true;
            state.revealStartTime = now;
            soundEngine.playSuspenseHeartbeat();

            const winnerIdx = getWinningSliceIndex(state.currentAngle);
            const winner = state.options[winnerIdx];
            if (winner) {
                currentSliceLabel.innerHTML = `🎯 <strong class="text-amber-300 text-base">${escapeHtml(winner.text)}!</strong>`;
            }
        }
    } else if (state.isRevealingWinner) {
        // Hold dramatic spotlight on the winning slice for 650ms before popping the celebration modal
        const revealElapsed = now - state.revealStartTime;
        if (revealElapsed >= 650) {
            state.isRevealingWinner = false;
            state.suspenseIntensity = 0;
            wheelWrapper.style.transform = '';
            wheelWrapper.style.filter = '';
            mainSpinBtn.disabled = false;
            centerHubBtn.disabled = false;
            statusIndicator.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400';

            const winnerIdx = getWinningSliceIndex(state.currentAngle);
            handleSpinWinner(winnerIdx);
        }
    } else if (state.isIdleMoving) {
        // Gentle partial/ambient rotation while waiting to start
        const dt = state.lastFrameTime ? Math.min(50, now - state.lastFrameTime) : 16.67;
        state.currentAngle = (state.currentAngle + state.idleSpeed * (dt / 16.67)) % (Math.PI * 2);

        const currentSliceIdx = getWinningSliceIndex(state.currentAngle);
        if (currentSliceIdx !== -1 && currentSliceIdx !== state.lastSegmentIndex) {
            state.lastSegmentIndex = currentSliceIdx;
            // Subtle flapper nudge as pegs gently pass by in idle mode
            state.pointerAngle = -0.14;
        }
    }
    state.lastFrameTime = now;

    // Spring physics return for the top pointer flapper
    if (Math.abs(state.pointerAngle) > 0.001 || Math.abs(state.pointerVelocity) > 0.001) {
        const springStiffness = 0.25;
        const damping = 0.75;
        const force = -springStiffness * state.pointerAngle;
        state.pointerVelocity = (state.pointerVelocity + force) * damping;
        state.pointerAngle += state.pointerVelocity;
    } else {
        state.pointerAngle = 0;
        state.pointerVelocity = 0;
    }

    drawWheel();
    requestAnimationFrame(updatePhysics);
}

/**
 * ============================================================================
 * WINNER HANDLING & MODAL CONTROLS
 * ============================================================================
 */
function handleSpinWinner(winnerIdx) {
    const winner = state.options[winnerIdx];
    if (!winner) return;

    state.lastWinnerIndex = winnerIdx;
    currentSliceLabel.innerHTML = `Winner: <strong class="text-amber-300">${escapeHtml(winner.text)}</strong>`;

    // Play victory chord
    soundEngine.playWinFanfare();

    // Launch multi-wave jackpot fireworks & golden star confetti above the modal
    launchJackpotConfetti(winner.color);

    // Record in History Log & Persist to localStorage
    const nowDate = new Date();
    const timestamp = nowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = nowDate.toLocaleDateString();
    const nextSpinNum = state.history.length > 0 ? (Math.max(...state.history.map(h => h.spinNumber || 0)) + 1) : 1;
    state.history.unshift({
        id: Date.now(),
        text: winner.text,
        color: winner.color,
        time: timestamp,
        date: dateStr,
        spinNumber: nextSpinNum
    });
    saveStateToStorage();
    renderHistoryList();

    // Automatically eliminate winner if checkbox is enabled (and >2 options exist)
    if (eliminateWinnerToggle.checked && state.options.length > 2) {
        state.options.splice(winnerIdx, 1);
        saveStateToStorage();
        renderOptionsList();
        drawWheel();
    }

    // Count how many times this winner has won in total
    const winCount = state.history.filter(h => h.text === winner.text).length;
    const streakBadge = winCount > 1 ? ` • 🔥 ${winCount}x Winner!` : '';

    // Populate & Show Winner Modal with Dynamic Glow & Shimmer
    modalWinnerBanner.style.backgroundColor = winner.color;
    modalWinnerBanner.style.boxShadow = `0 12px 45px ${winner.color}88, inset 0 2px 12px rgba(255, 255, 255, 0.45)`;
    if (modalAmbientGlow) {
        modalAmbientGlow.style.backgroundColor = winner.color;
    }
    modalWinnerText.textContent = winner.text;
    modalSpinStats.textContent = `Spin #${state.history[0].spinNumber} • Landed at ${timestamp}${streakBadge}`;
    
    // Disable "Remove Option" button in modal if already auto-removed or <= 2 options left
    if (eliminateWinnerToggle.checked || state.options.length <= 2) {
        modalRemoveWinnerBtn.classList.add('hidden');
    } else {
        modalRemoveWinnerBtn.classList.remove('hidden');
    }

    winnerModal.classList.remove('hidden');
    winnerModal.classList.add('flex');
}

function closeWinnerModal() {
    clearCelebrationTimeouts();
    winnerModal.classList.add('hidden');
    winnerModal.classList.remove('flex');
    state.isIdleMoving = true;
}

/**
 * ============================================================================
 * OPTIONS & HISTORY UI RENDERING
 * ============================================================================
 */
function renderOptionsList() {
    saveStateToStorage();
    optionCountBadge.textContent = state.options.length;
    optionsListContainer.innerHTML = '';

    state.options.forEach((opt, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 bg-slate-900/75 hover:bg-slate-900 border border-white/10 rounded-xl p-2 transition group';

        // Color Picker Swatch
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = opt.color;
        colorInput.title = 'Customize slice color';
        colorInput.className = 'w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 shrink-0';
        colorInput.addEventListener('input', (e) => {
            state.options[idx].color = e.target.value;
            saveStateToStorage();
            drawWheel();
        });

        // Editable Text Input
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = opt.text;
        textInput.maxLength = 40;
        textInput.setAttribute('aria-label', `Option ${idx + 1} text`);
        textInput.className = 'flex-1 bg-transparent text-sm text-slate-100 focus:outline-none focus:bg-slate-800/80 px-2.5 py-1 rounded-lg transition';
        textInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            state.options[idx].text = val || `Option ${idx + 1}`;
            saveStateToStorage();
            drawWheel();
        });

        // Delete Option Button
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.title = 'Remove option';
        delBtn.className = 'w-8 h-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition shrink-0';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        delBtn.addEventListener('click', () => {
            if (state.options.length <= 2) {
                showValidationNotice('Minimum of 2 options required on the wheel!');
                return;
            }
            state.options.splice(idx, 1);
            renderOptionsList();
            drawWheel();
        });

        row.appendChild(colorInput);
        row.appendChild(textInput);
        row.appendChild(delBtn);
        optionsListContainer.appendChild(row);
    });
}

function renderHistoryList() {
    historyCountBadge.textContent = state.history.length;
    historyListContainer.innerHTML = '';

    // Update Always-Visible Saved Spin Winners Strip & Stage Mode Winners Ticker
    if (recentWinnersStrip) {
        if (state.history.length === 0) {
            recentWinnersStrip.innerHTML = '<span class="text-xs text-slate-500 italic">No winners yet — spin the wheel!</span>';
        } else {
            recentWinnersStrip.innerHTML = '';
            state.history.forEach((item) => {
                const badge = document.createElement('div');
                badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-white/10 text-xs';
                badge.innerHTML = `
                    <span class="font-mono text-[10px] font-bold text-amber-400">#${item.spinNumber}</span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${item.color}"></span>
                    <span class="font-semibold text-white max-w-[130px] truncate">${escapeHtml(item.text)}</span>
                `;
                recentWinnersStrip.appendChild(badge);
            });
        }
    }

    if (stageWinnersList) {
        if (state.history.length === 0) {
            stageWinnersList.innerHTML = '<span class="text-xs text-slate-400 italic">Press SPACE or click the wheel to spin!</span>';
        } else {
            stageWinnersList.innerHTML = '';
            state.history.forEach((item) => {
                const badge = document.createElement('div');
                badge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/95 border border-amber-400/30 text-xs shrink-0 shadow';
                badge.innerHTML = `
                    <span class="font-mono text-xs font-bold text-amber-400">#${item.spinNumber}</span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${item.color}"></span>
                    <span class="font-bold text-white max-w-[160px] truncate">${escapeHtml(item.text)}</span>
                `;
                stageWinnersList.appendChild(badge);
            });
        }
    }

    if (state.history.length === 0) {
        leaderboardContainer.classList.add('hidden');
        historyListContainer.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                <i class="fa-solid fa-trophy text-3xl mb-2 opacity-40"></i>
                <p class="text-sm font-medium">No winners recorded yet</p>
                <p class="text-xs">Every spin winner is automatically saved here!</p>
            </div>
        `;
        return;
    }

    // Compute Win Counts per Winner Name for Leaderboard Summary
    const countsMap = new Map();
    state.history.forEach((item) => {
        const prev = countsMap.get(item.text) || { count: 0, color: item.color };
        prev.count += 1;
        countsMap.set(item.text, prev);
    });
    const sortedLeaders = Array.from(countsMap.entries()).sort((a, b) => b[1].count - a[1].count);

    leaderboardContainer.classList.remove('hidden');
    leaderboardPills.innerHTML = '';
    sortedLeaders.forEach(([name, info]) => {
        const pill = document.createElement('div');
        pill.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-white/10 text-xs';
        pill.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${info.color}"></span>
            <span class="text-slate-200 font-medium max-w-[130px] truncate">${escapeHtml(name)}</span>
            <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">${info.count}x</span>
        `;
        leaderboardPills.appendChild(pill);
    });

    state.history.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'flex items-center justify-between gap-2 bg-slate-900/75 border border-white/10 rounded-xl p-2.5 group';
        card.innerHTML = `
            <div class="flex items-center gap-2.5 min-w-0">
                <span class="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold shrink-0">
                    #${item.spinNumber}
                </span>
                <span class="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white/20" style="background-color: ${item.color}"></span>
                <div class="truncate">
                    <p class="text-sm font-semibold text-white truncate">${escapeHtml(item.text)}</p>
                    <p class="text-[11px] text-slate-400">${item.date ? item.date + ' • ' : ''}${item.time}</p>
                </div>
            </div>
            <button type="button" data-del-history="${idx}" class="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition shrink-0" title="Remove this entry">
                <i class="fa-solid fa-xmark text-xs"></i>
            </button>
        `;
        const delEntryBtn = card.querySelector('[data-del-history]');
        delEntryBtn.addEventListener('click', () => {
            state.history.splice(idx, 1);
            saveStateToStorage();
            renderHistoryList();
        });
        historyListContainer.appendChild(card);
    });
}

/**
 * ============================================================================
 * EVENT LISTENERS & INTERACTIONS
 * ============================================================================
 */
mainSpinBtn.addEventListener('click', triggerSpin);
centerHubBtn.addEventListener('click', triggerSpin);
canvas.addEventListener('click', triggerSpin);

// Touch Swipe Support on Wheel Canvas
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
        if (deltaY > 25) triggerSpin();
    }
}, { passive: true });

// Spin Duration Slider, Custom Number Input & Quick Preset Pills
function setSpinDurationSeconds(sec) {
    const clamped = Math.max(1, Math.min(300, Math.round(Number(sec) || 8)));
    spinDurationInput.value = clamped;
    spinDurationRange.value = Math.min(60, Math.max(3, clamped));
}

spinDurationRange.addEventListener('input', (e) => {
    spinDurationInput.value = e.target.value;
});

spinDurationInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
        spinDurationRange.value = Math.min(60, Math.max(3, val));
    }
});

spinDurationInput.addEventListener('change', (e) => {
    setSpinDurationSeconds(e.target.value);
});

spinTimePresetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
        setSpinDurationSeconds(btn.getAttribute('data-spin-time'));
    });
});

// Add New Option Form (supports single item or multi-item paste)
function parseBulkNames(rawText) {
    if (!rawText) return [];
    let parts = rawText.split(/\r?\n/);
    if (parts.length === 1 && /[,;\t]/.test(rawText)) {
        parts = rawText.split(/[,;\t]+/);
    }
    return parts
        .map(s => s.trim().slice(0, 40))
        .filter(Boolean);
}

function addBulkItems(names, replaceAll = false) {
    if (names.length === 0) {
        showValidationNotice('Paste or enter at least 1 name first!');
        return;
    }
    if (replaceAll && names.length < 2) {
        showValidationNotice('Need at least 2 names to replace the whole wheel!');
        return;
    }

    if (replaceAll) {
        state.options = names.map((text, i) => ({
            text,
            color: VIBRANT_PALETTE[i % VIBRANT_PALETTE.length]
        }));
    } else {
        names.forEach((text) => {
            const nextColor = VIBRANT_PALETTE[state.options.length % VIBRANT_PALETTE.length];
            state.options.push({ text, color: nextColor });
        });
    }

    renderOptionsList();
    drawWheel();
    optionsListContainer.scrollTop = optionsListContainer.scrollHeight;
}

newOptionInput.addEventListener('paste', (e) => {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const names = parseBulkNames(pastedText);
    if (names.length > 1) {
        e.preventDefault();
        addBulkItems(names, false);
        newOptionInput.value = '';
    }
});

addOptionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const names = parseBulkNames(newOptionInput.value);
    if (names.length === 0) return;

    addBulkItems(names, false);
    newOptionInput.value = '';
});

// Bulk Paste Drawer Controls
function toggleBulkDrawer(forceShow) {
    const isHidden = bulkPasteDrawer.classList.contains('hidden');
    const shouldShow = typeof forceShow === 'boolean' ? forceShow : isHidden;
    if (shouldShow) {
        bulkPasteDrawer.classList.remove('hidden');
        bulkPasteDrawer.classList.add('flex');
        bulkNamesTextarea.focus();
    } else {
        bulkPasteDrawer.classList.add('hidden');
        bulkPasteDrawer.classList.remove('flex');
    }
}

bulkPasteToggleBtn.addEventListener('click', () => toggleBulkDrawer());
closeBulkDrawerBtn.addEventListener('click', () => toggleBulkDrawer(false));

bulkNamesTextarea.addEventListener('input', () => {
    const count = parseBulkNames(bulkNamesTextarea.value).length;
    bulkCountPreview.textContent = `${count} ${count === 1 ? 'name' : 'names'} detected`;
});

bulkAppendBtn.addEventListener('click', () => {
    const names = parseBulkNames(bulkNamesTextarea.value);
    if (names.length === 0) {
        showValidationNotice('Paste some names in the box first!');
        return;
    }
    addBulkItems(names, false);
    bulkNamesTextarea.value = '';
    bulkCountPreview.textContent = '0 names detected';
    toggleBulkDrawer(false);
});

bulkReplaceBtn.addEventListener('click', () => {
    const names = parseBulkNames(bulkNamesTextarea.value);
    if (names.length < 2) {
        showValidationNotice('Please paste at least 2 names to replace the wheel!');
        return;
    }
    addBulkItems(names, true);
    bulkNamesTextarea.value = '';
    bulkCountPreview.textContent = '0 names detected';
    toggleBulkDrawer(false);
});

// Shuffle, Sort & Reset Buttons
shuffleOptionsBtn.addEventListener('click', () => {
    for (let i = state.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.options[i], state.options[j]] = [state.options[j], state.options[i]];
    }
    renderOptionsList();
    drawWheel();
});

sortOptionsBtn.addEventListener('click', () => {
    state.options.sort((a, b) => a.text.localeCompare(b.text));
    renderOptionsList();
    drawWheel();
});

resetOptionsBtn.addEventListener('click', () => {
    state.options = JSON.parse(JSON.stringify(PRESETS.prizes));
    presetSelect.value = 'prizes';
    renderOptionsList();
    drawWheel();
});

// Preset Selector
presetSelect.addEventListener('change', (e) => {
    const key = e.target.value;
    if (PRESETS[key]) {
        state.options = JSON.parse(JSON.stringify(PRESETS[key]));
        renderOptionsList();
        drawWheel();
    }
});

// Sound Theme Selector & Preview Chime (synced between Top Nav & Control Panel)
function setSoundTheme(theme) {
    state.soundTheme = theme;
    if (soundThemeSelect) soundThemeSelect.value = theme;
    if (panelSoundThemeSelect) panelSoundThemeSelect.value = theme;
    soundEngine.init().then(() => {
        soundEngine.playTick(0.8);
    });
}

soundThemeSelect.addEventListener('change', (e) => setSoundTheme(e.target.value));
panelSoundThemeSelect.addEventListener('change', (e) => setSoundTheme(e.target.value));

// Background Music Controls (synced between Top Nav & Control Panel)
function updateBgmUI() {
    if (state.bgmEnabled) {
        bgmToggleBtn.className = 'h-10 px-3 rounded-xl bg-pink-600/25 hover:bg-pink-600/40 text-pink-300 border border-pink-400/40 flex items-center gap-1.5 transition shadow-sm text-xs font-semibold';
        bgmIcon.className = 'fa-solid fa-compact-disc animate-spin';
        bgmStatusLabel.textContent = 'BGM On';
        panelBgmToggleIcon.className = 'fa-solid fa-pause text-[9px]';
        panelBgmToggleText.textContent = 'Stop';
        panelBgmTrackSelect.value = state.bgmTrack;
        bgmTrackSelect.value = state.bgmTrack;
    } else {
        bgmToggleBtn.className = 'h-10 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 border border-white/10 flex items-center gap-1.5 transition shadow-sm text-xs font-semibold';
        bgmIcon.className = 'fa-solid fa-music';
        bgmStatusLabel.textContent = 'BGM Off';
        panelBgmToggleIcon.className = 'fa-solid fa-play text-[9px]';
        panelBgmToggleText.textContent = 'Play';
        panelBgmTrackSelect.value = 'off';
    }
}

function toggleBackgroundMusic(forceState) {
    state.bgmEnabled = typeof forceState === 'boolean' ? forceState : !state.bgmEnabled;
    if (state.bgmEnabled && (!state.bgmTrack || state.bgmTrack === 'off')) {
        state.bgmTrack = bgmTrackSelect.value || 'showtime';
    }
    updateBgmUI();
    if (state.bgmEnabled) {
        soundEngine.startBGM();
    } else {
        soundEngine.stopBGM();
    }
}

bgmToggleBtn.addEventListener('click', () => toggleBackgroundMusic());
panelBgmToggleBtn.addEventListener('click', () => toggleBackgroundMusic());

bgmTrackSelect.addEventListener('change', (e) => {
    state.bgmTrack = e.target.value;
    toggleBackgroundMusic(true);
});

panelBgmTrackSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'off') {
        toggleBackgroundMusic(false);
    } else {
        state.bgmTrack = val;
        toggleBackgroundMusic(true);
    }
});

// Sound Mute Toggle
soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
        soundIcon.className = 'fa-solid fa-volume-high';
        soundToggleBtn.classList.replace('text-slate-500', 'text-amber-400');
    } else {
        soundIcon.className = 'fa-solid fa-volume-xmark';
        soundToggleBtn.classList.replace('text-amber-400', 'text-slate-500');
    }
});

// Tab Switching (Options vs History)
tabOptionsBtn.addEventListener('click', () => {
    optionsTabPanel.classList.remove('hidden');
    historyTabPanel.classList.add('hidden');
    tabOptionsBtn.className = 'py-2.5 px-4 rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2 bg-brand-600 text-white shadow-lg transition';
    tabHistoryBtn.className = 'py-2.5 px-4 rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 transition';
});

tabHistoryBtn.addEventListener('click', () => {
    historyTabPanel.classList.remove('hidden');
    optionsTabPanel.classList.add('hidden');
    tabHistoryBtn.className = 'py-2.5 px-4 rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2 bg-brand-600 text-white shadow-lg transition';
    tabOptionsBtn.className = 'py-2.5 px-4 rounded-2xl font-display font-semibold text-sm flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 transition';
});

// Clear, Copy & Export History
clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveStateToStorage();
    renderHistoryList();
});

viewAllWinnersBtn.addEventListener('click', () => {
    tabHistoryBtn.click();
});

copyHistoryBtn.addEventListener('click', () => {
    if (state.history.length === 0) {
        showValidationNotice('No winners to copy yet!');
        return;
    }
    const lines = state.history
        .slice()
        .reverse()
        .map(h => `Spin #${h.spinNumber}: ${h.text} (${h.date ? h.date + ' ' : ''}${h.time})`);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
        const origHTML = copyHistoryBtn.innerHTML;
        copyHistoryBtn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> Copied!';
        setTimeout(() => { copyHistoryBtn.innerHTML = origHTML; }, 1800);
    });
});

downloadHistoryBtn.addEventListener('click', () => {
    if (state.history.length === 0) {
        showValidationNotice('No winners to export yet!');
        return;
    }
    const csvRows = ['Spin Number,Winner,Date,Time'];
    state.history.slice().reverse().forEach((h) => {
        const safeText = `"${String(h.text).replace(/"/g, '""')}"`;
        csvRows.push(`${h.spinNumber},${safeText},${h.date || ''},${h.time}`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-of-wheel-winners-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// Modal Actions
closeModalBtn.addEventListener('click', closeWinnerModal);
modalSpinAgainBtn.addEventListener('click', closeWinnerModal);
winnerModal.addEventListener('click', (e) => {
    if (e.target === winnerModal) closeWinnerModal();
});

modalRemoveWinnerBtn.addEventListener('click', () => {
    if (state.lastWinnerIndex !== null && state.options.length > 2) {
        state.options.splice(state.lastWinnerIndex, 1);
        state.lastWinnerIndex = null;
        renderOptionsList();
        drawWheel();
    }
    closeWinnerModal();
});

// Window Resize Listener
window.addEventListener('resize', resizeCanvas);

// Stage Big-Screen Fullscreen Mode & Keyboard Shortcuts
function updateStageModeUI(isStage) {
    if (isStage) {
        document.body.classList.add('stage-mode');
        stageModeIcon.className = 'fa-solid fa-compress';
        stageModeText.textContent = 'Exit Stage';
    } else {
        document.body.classList.remove('stage-mode');
        stageModeIcon.className = 'fa-solid fa-expand';
        stageModeText.textContent = 'Stage Mode';
    }
    requestAnimationFrame(() => {
        resizeCanvas();
        setTimeout(resizeCanvas, 80);
    });
}

async function toggleStageMode() {
    const isCurrentlyStage = document.body.classList.contains('stage-mode');
    if (!isCurrentlyStage) {
        updateStageModeUI(true);
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                // Browser fullscreen blocked or unsupported; CSS stage layout still activates
            }
        }
    } else {
        updateStageModeUI(false);
        if (document.fullscreenElement && document.exitFullscreen) {
            try {
                await document.exitFullscreen();
            } catch (e) {}
        }
    }
}

stageModeBtn.addEventListener('click', toggleStageMode);

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('stage-mode')) {
        updateStageModeUI(false);
    }
});

// Stage Presenter Keyboard Shortcuts: [SPACE] to Spin / Close Modal, [F] for Stage Fullscreen
window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (e.code === 'Space') {
        e.preventDefault();
        if (!winnerModal.classList.contains('hidden')) {
            closeWinnerModal();
        } else {
            triggerSpin();
        }
    } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleStageMode();
    } else if (e.key === 'Escape' && document.body.classList.contains('stage-mode') && !document.fullscreenElement) {
        updateStageModeUI(false);
    }
});

// Initialize Application on Load
function initApp() {
    loadStateFromStorage();
    renderOptionsList();
    renderHistoryList();
    resizeCanvas();
    requestAnimationFrame(updatePhysics);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

