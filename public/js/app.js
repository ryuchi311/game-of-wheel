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

// Drama & Atmosphere Checkboxes & Collapse Controls
const modeDramatic = document.getElementById('modeDramatic');
const modeIntense = document.getElementById('modeIntense');
const modeThrill = document.getElementById('modeThrill');
const modeSurprise = document.getElementById('modeSurprise');
const modePanic = document.getElementById('modePanic');
const modeFunny = document.getElementById('modeFunny');
const toggleDramaCollapseBtn = document.getElementById('toggleDramaCollapseBtn');
const dramaCheckboxesContainer = document.getElementById('dramaCheckboxesContainer');
const dramaCollapseIcon = document.getElementById('dramaCollapseIcon');
const dramaCollapseLabel = document.getElementById('dramaCollapseLabel');

// Wheel Refresh Rate (FPS) Toggle Buttons
const fps60Btn = document.getElementById('fps60Btn');
const fps30Btn = document.getElementById('fps30Btn');

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

const donateBtn = document.getElementById('donateBtn');
const sideDonateBtn = document.getElementById('sideDonateBtn');
const footerDonateBtn = document.getElementById('footerDonateBtn');
const donateModal = document.getElementById('donateModal');
const closeDonateModalBtn = document.getElementById('closeDonateModalBtn');

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
// Funny / Humorous winner titles & quotes
const FUNNY_WINNER_QUOTES = [
    "Certified Wheel Champion! 👑",
    "Against all odds (and basic math)! 😂",
    "Physics looked the other way! 🚀",
    "Don't spend it all in one place! 🍕",
    "The council of spinners has decided! 🧙‍♂️",
    "Rigged? Absolutely not! (Maybe?) 😜",
    "Pure skill, zero luck! 🧠"
];

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

    // Clear previous visual effect classes
    document.body.classList.remove('panic-shake', 'intense-alarm-border');
    wheelWrapper.classList.remove('funny-wobble');

    // Sync active modifiers from checkboxes
    state.modes.dramatic = modeDramatic ? modeDramatic.checked : true;
    state.modes.intense = modeIntense ? modeIntense.checked : false;
    state.modes.thrill = modeThrill ? modeThrill.checked : false;
    state.modes.surprise = modeSurprise ? modeSurprise.checked : false;
    state.modes.panic = modePanic ? modePanic.checked : false;
    state.modes.funny = modeFunny ? modeFunny.checked : false;

    // Apply Intense alarm visual & Funny wobble immediately if selected
    if (state.modes.intense) {
        document.body.classList.add('intense-alarm-border');
    }
    if (state.modes.funny) {
        wheelWrapper.classList.add('funny-wobble');
    }

    const customSec = parseFloat(spinDurationInput.value);
    let durationSec = (!isNaN(customSec) && customSec >= 1) ? Math.min(300, customSec) : (parseInt(spinDurationRange.value, 10) || 8);
    
    // Thrill mode adds a suspenseful extended crawl
    if (state.modes.thrill) {
        durationSec = Math.max(durationSec, 9);
    }

    state.spinDuration = durationSec * 1000;
    state.spinStartTime = performance.now();
    state.startAngle = state.currentAngle;

    // Scale full rotations proportionally with spin duration so longer spins stay energetic
    let baseRotations = Math.max(6, Math.round(durationSec * 1.4));
    if (state.modes.panic) baseRotations += 4; // Extra fast spin in panic mode
    const extraSpins = (baseRotations + Math.random() * 4) * Math.PI * 2;
    const randomStopOffset = Math.random() * Math.PI * 2;
    state.targetAngle = state.startAngle + extraSpins + randomStopOffset;

    state.lastSegmentIndex = getWinningSliceIndex(state.currentAngle);
}

let lastWheelRenderTime = 0;

function updatePhysics(now) {
    // Limit wheel canvas rendering to selected wheelFps (60 or 30 FPS) while leaving everything else native
    const fpsInterval = (state.wheelFps === 30) ? (1000 / 30) : (1000 / 60);
    const elapsedSinceLastRender = now - lastWheelRenderTime;

    if (elapsedSinceLastRender < fpsInterval - 1) {
        requestAnimationFrame(updatePhysics);
        return;
    }
    lastWheelRenderTime = now - (elapsedSinceLastRender % fpsInterval);
    if (state.isSpinning) {
        const elapsed = now - state.spinStartTime;
        let progress = Math.min(1, elapsed / state.spinDuration);

        // Surprise fake-out modifier: near finish (progress 0.88 - 0.96), wheel hesitates or briefly reverses
        let easedProgress = progress;
        if (state.modes.surprise && progress > 0.84 && progress < 0.98) {
            const fakeOutDip = Math.sin((progress - 0.84) / 0.14 * Math.PI) * 0.022;
            easedProgress = Math.max(0, easeOutQuart(progress) - fakeOutDip);
        } else {
            easedProgress = easeOutQuart(progress);
        }

        const prevAngle = state.currentAngle;
        state.currentAngle = state.startAngle + (state.targetAngle - state.startAngle) * easedProgress;
        const deltaAngle = state.currentAngle - prevAngle;

        // Track suspense intensity during the final 35% of the spin
        state.suspenseIntensity = progress > 0.65 ? (progress - 0.65) / 0.35 : 0;

        // Panic mode screen shaking trigger in final stretch
        if (state.modes.panic) {
            if (progress > 0.60 && !document.body.classList.contains('panic-shake')) {
                document.body.classList.add('panic-shake');
            }
        }

        // Dynamic camera zoom & glow intensification on the wheel wrapper during final suspense
        if (state.suspenseIntensity > 0) {
            let scale = 1 + state.suspenseIntensity * 0.045;
            if (state.modes.dramatic) scale = 1 + state.suspenseIntensity * 0.075;
            const glowColor = state.modes.panic ? 'rgba(239, 68, 68,' : (state.modes.intense ? 'rgba(59, 130, 246,' : 'rgba(245, 158, 11,');
            const glowPx = Math.round(35 + state.suspenseIntensity * (state.modes.dramatic ? 55 : 35));
            wheelWrapper.style.transform = `scale(${scale.toFixed(4)})`;
            wheelWrapper.style.filter = `drop-shadow(0 0 ${glowPx}px ${glowColor} ${(0.35 + state.suspenseIntensity * 0.45).toFixed(2)}))`;
        }

        // Check if a slice boundary passed under the 12 o'clock pointer
        const currentSliceIdx = getWinningSliceIndex(state.currentAngle);
        if (currentSliceIdx !== -1 && currentSliceIdx !== state.lastSegmentIndex) {
            state.lastSegmentIndex = currentSliceIdx;
            
            // Deflect the pointer flapper when hit by a peg
            const speedFactor = Math.min(1, Math.abs(deltaAngle) * 14);
            state.pointerAngle = -0.45 * Math.max(0.35, speedFactor);
            
            // Play peg tick sound or special FX
            if (state.modes.intense && progress > 0.85) {
                soundEngine.playAlarmSiren();
            } else if (state.modes.funny && progress > 0.90) {
                soundEngine.playBoingSound();
            } else {
                soundEngine.playTick(1 - progress);
            }

            // Update live status banner with atmospheric messaging
            const activeOption = state.options[currentSliceIdx];
            if (activeOption) {
                if (state.modes.panic && progress > 0.70) {
                    currentSliceLabel.innerHTML = `<span class="text-rose-400 font-bold animate-ping">⚠️ PANIC! It's stopping on: ${escapeHtml(activeOption.text)}!</span>`;
                } else if (state.modes.surprise && progress > 0.85) {
                    currentSliceLabel.innerHTML = `<span class="text-cyan-300 font-semibold animate-pulse">Wait... FAKE-OUT?! ${escapeHtml(activeOption.text)}?</span>`;
                } else if (state.modes.thrill && progress > 0.88) {
                    currentSliceLabel.innerHTML = `<span class="text-violet-300 font-semibold animate-pulse">😱 Millimeter crawl... ${escapeHtml(activeOption.text)}!</span>`;
                } else if (state.modes.funny && progress > 0.75) {
                    currentSliceLabel.innerHTML = `<span class="text-emerald-300 font-semibold">🤡 Uh oh... ${escapeHtml(activeOption.text)} incoming!</span>`;
                } else if (progress > 0.78) {
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

            // Clear panic shake on stop
            document.body.classList.remove('panic-shake');

            const winnerIdx = getWinningSliceIndex(state.currentAngle);
            const winner = state.options[winnerIdx];
            if (winner) {
                currentSliceLabel.innerHTML = `🎯 <strong class="text-amber-300 text-base">${escapeHtml(winner.text)}!</strong>`;
            }
        }
    } else if (state.isRevealingWinner) {
        // Dramatic spotlight hold before modal popup (longer hold if dramatic mode)
        const revealElapsed = now - state.revealStartTime;
        const revealHoldTime = state.modes.dramatic ? 900 : 650;
        if (revealElapsed >= revealHoldTime) {
            state.isRevealingWinner = false;
            state.suspenseIntensity = 0;
            wheelWrapper.style.transform = '';
            wheelWrapper.style.filter = '';
            wheelWrapper.classList.remove('funny-wobble');
            document.body.classList.remove('panic-shake', 'intense-alarm-border');
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
    let streakBadge = winCount > 1 ? ` • 🔥 ${winCount}x Winner!` : '';

    // Funny Mode comic quote
    if (state.modes.funny) {
        const randomQuote = FUNNY_WINNER_QUOTES[Math.floor(Math.random() * FUNNY_WINNER_QUOTES.length)];
        streakBadge += ` • ${randomQuote}`;
    }

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

        // Delete Option Button with double-click / confirmation safeguard
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.title = 'Remove option';
        delBtn.className = 'w-8 h-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition shrink-0';
        delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        
        let confirmTimeout = null;
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.options.length <= 2) {
                showValidationNotice('Minimum of 2 options required on the wheel!');
                return;
            }

            // Two-step confirmation: first click asks "Sure?", second click confirms deletion
            if (delBtn.getAttribute('data-confirming') === 'true') {
                clearTimeout(confirmTimeout);
                state.options.splice(idx, 1);
                renderOptionsList();
                drawWheel();
            } else {
                delBtn.setAttribute('data-confirming', 'true');
                delBtn.className = 'px-2 h-7 rounded-lg text-[11px] font-semibold bg-rose-600/30 text-rose-300 border border-rose-400/50 flex items-center gap-1 transition shrink-0 animate-pulse';
                delBtn.innerHTML = '<i class="fa-solid fa-trash-can text-[10px]"></i> Sure?';
                
                // Reset back to normal after 2.8 seconds if not clicked again
                confirmTimeout = setTimeout(() => {
                    delBtn.removeAttribute('data-confirming');
                    delBtn.className = 'w-8 h-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition shrink-0';
                    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                }, 2800);
            }
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
        let historyConfirmTimeout = null;
        delEntryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (delEntryBtn.getAttribute('data-confirming') === 'true') {
                clearTimeout(historyConfirmTimeout);
                state.history.splice(idx, 1);
                saveStateToStorage();
                renderHistoryList();
            } else {
                delEntryBtn.setAttribute('data-confirming', 'true');
                delEntryBtn.className = 'px-1.5 h-6 rounded-md text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-400/50 flex items-center gap-1 transition shrink-0 animate-pulse';
                delEntryBtn.innerHTML = 'Sure?';
                historyConfirmTimeout = setTimeout(() => {
                    delEntryBtn.removeAttribute('data-confirming');
                    delEntryBtn.className = 'w-7 h-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition shrink-0';
                    delEntryBtn.innerHTML = '<i class="fa-solid fa-xmark text-xs"></i>';
                }, 2800);
            }
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

// Wheel Refresh Rate (FPS) Selector Controls
function setWheelFps(fps) {
    state.wheelFps = fps;
    if (fps === 30) {
        if (fps30Btn) {
            fps30Btn.className = 'px-2.5 py-1 rounded-lg font-semibold bg-brand-600 text-white shadow-sm transition';
        }
        if (fps60Btn) {
            fps60Btn.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';
        }
    } else {
        state.wheelFps = 60;
        if (fps60Btn) {
            fps60Btn.className = 'px-2.5 py-1 rounded-lg font-semibold bg-brand-600 text-white shadow-sm transition';
        }
        if (fps30Btn) {
            fps30Btn.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';
        }
    }
}

if (fps60Btn) fps60Btn.addEventListener('click', () => setWheelFps(60));
if (fps30Btn) fps30Btn.addEventListener('click', () => setWheelFps(30));

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

// Drama & Atmosphere Checkboxes Collapse / Expand Toggle
if (toggleDramaCollapseBtn && dramaCheckboxesContainer) {
    toggleDramaCollapseBtn.addEventListener('click', () => {
        const isCollapsed = dramaCheckboxesContainer.classList.contains('hidden');
        if (isCollapsed) {
            dramaCheckboxesContainer.classList.remove('hidden');
            dramaCheckboxesContainer.classList.add('grid');
            if (dramaCollapseIcon) dramaCollapseIcon.className = 'fa-solid fa-chevron-up text-[10px] transition-transform duration-200';
            if (dramaCollapseLabel) dramaCollapseLabel.textContent = '(collapse)';
        } else {
            dramaCheckboxesContainer.classList.add('hidden');
            dramaCheckboxesContainer.classList.remove('grid');
            if (dramaCollapseIcon) dramaCollapseIcon.className = 'fa-solid fa-chevron-down text-[10px] transition-transform duration-200';
            if (dramaCollapseLabel) dramaCollapseLabel.textContent = '(expand)';
        }
    });
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

// Sound Theme Selector & Preview Chime
function setSoundTheme(theme) {
    state.soundTheme = theme;
    if (soundThemeSelect) soundThemeSelect.value = theme;
    if (panelSoundThemeSelect) panelSoundThemeSelect.value = theme;
    soundEngine.init().then(() => {
        soundEngine.playTick(0.8);
    });
}

if (soundThemeSelect) soundThemeSelect.addEventListener('change', (e) => setSoundTheme(e.target.value));
if (panelSoundThemeSelect) panelSoundThemeSelect.addEventListener('change', (e) => setSoundTheme(e.target.value));

// Background Music Controls (synced with Sound Settings card)
function updateBgmUI() {
    if (state.bgmEnabled) {
        if (bgmToggleBtn) {
            bgmToggleBtn.className = 'h-10 px-2.5 sm:px-3 rounded-xl bg-pink-600/25 hover:bg-pink-600/40 text-pink-300 border border-pink-400/40 flex items-center gap-1.5 transition shadow-sm text-xs font-semibold';
            if (bgmIcon) bgmIcon.className = 'fa-solid fa-compact-disc animate-spin';
            if (bgmStatusLabel) bgmStatusLabel.textContent = 'BGM On';
        }
        if (panelBgmToggleIcon) panelBgmToggleIcon.className = 'fa-solid fa-pause text-[9px]';
        if (panelBgmToggleText) panelBgmToggleText.textContent = 'Stop';
        if (panelBgmTrackSelect) panelBgmTrackSelect.value = state.bgmTrack;
        if (bgmTrackSelect) bgmTrackSelect.value = state.bgmTrack;
    } else {
        if (bgmToggleBtn) {
            bgmToggleBtn.className = 'h-10 px-2.5 sm:px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-400 border border-white/10 flex items-center gap-1.5 transition shadow-sm text-xs font-semibold';
            if (bgmIcon) bgmIcon.className = 'fa-solid fa-music';
            if (bgmStatusLabel) bgmStatusLabel.textContent = 'BGM Off';
        }
        if (panelBgmToggleIcon) panelBgmToggleIcon.className = 'fa-solid fa-play text-[9px]';
        if (panelBgmToggleText) panelBgmToggleText.textContent = 'Play';
        if (panelBgmTrackSelect) panelBgmTrackSelect.value = 'off';
    }
}

function toggleBackgroundMusic(forceState) {
    state.bgmEnabled = typeof forceState === 'boolean' ? forceState : !state.bgmEnabled;
    if (state.bgmEnabled && (!state.bgmTrack || state.bgmTrack === 'off')) {
        state.bgmTrack = (panelBgmTrackSelect && panelBgmTrackSelect.value !== 'off')
            ? panelBgmTrackSelect.value
            : 'showtime';
    }
    updateBgmUI();
    if (state.bgmEnabled) {
        soundEngine.startBGM();
    } else {
        soundEngine.stopBGM();
    }
}

if (bgmToggleBtn) bgmToggleBtn.addEventListener('click', () => toggleBackgroundMusic());
if (panelBgmToggleBtn) panelBgmToggleBtn.addEventListener('click', () => toggleBackgroundMusic());

if (bgmTrackSelect) {
    bgmTrackSelect.addEventListener('change', (e) => {
        state.bgmTrack = e.target.value;
        toggleBackgroundMusic(true);
    });
}

if (panelBgmTrackSelect) {
    panelBgmTrackSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'off') {
            toggleBackgroundMusic(false);
        } else {
            state.bgmTrack = val;
            toggleBackgroundMusic(true);
        }
    });
}

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

// Donation Modal Controls
function openDonateModal() {
    if (!donateModal) return;
    donateModal.classList.remove('hidden');
    donateModal.classList.add('flex');
}

function closeDonateModal() {
    if (!donateModal) return;
    donateModal.classList.add('hidden');
    donateModal.classList.remove('flex');
}

if (donateBtn) donateBtn.addEventListener('click', openDonateModal);
if (sideDonateBtn) sideDonateBtn.addEventListener('click', openDonateModal);
if (footerDonateBtn) footerDonateBtn.addEventListener('click', openDonateModal);
if (closeDonateModalBtn) closeDonateModalBtn.addEventListener('click', closeDonateModal);
if (donateModal) {
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) closeDonateModal();
    });
}

let modalRemoveTimeout = null;
modalRemoveWinnerBtn.addEventListener('click', () => {
    // Two-step confirmation on modal removal to prevent accidental taps
    if (modalRemoveWinnerBtn.getAttribute('data-confirming') === 'true') {
        clearTimeout(modalRemoveTimeout);
        modalRemoveWinnerBtn.removeAttribute('data-confirming');
        modalRemoveWinnerBtn.innerHTML = '<i class="fa-solid fa-ban text-rose-400"></i><span>Remove Option</span>';
        if (state.lastWinnerIndex !== null && state.options.length > 2) {
            state.options.splice(state.lastWinnerIndex, 1);
            state.lastWinnerIndex = null;
            renderOptionsList();
            drawWheel();
        }
        closeWinnerModal();
    } else {
        modalRemoveWinnerBtn.setAttribute('data-confirming', 'true');
        modalRemoveWinnerBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-400"></i><span>Click again to confirm</span>';
        modalRemoveWinnerBtn.classList.add('animate-pulse', 'border-rose-400/80');
        modalRemoveTimeout = setTimeout(() => {
            modalRemoveWinnerBtn.removeAttribute('data-confirming');
            modalRemoveWinnerBtn.innerHTML = '<i class="fa-solid fa-ban text-rose-400"></i><span>Remove Option</span>';
            modalRemoveWinnerBtn.classList.remove('animate-pulse', 'border-rose-400/80');
        }, 3200);
    }
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
        if (donateModal && !donateModal.classList.contains('hidden')) {
            closeDonateModal();
        } else if (!winnerModal.classList.contains('hidden')) {
            closeWinnerModal();
        } else {
            triggerSpin();
        }
    } else if (e.key === 'Escape') {
        if (donateModal && !donateModal.classList.contains('hidden')) {
            closeDonateModal();
        } else if (document.body.classList.contains('stage-mode') && !document.fullscreenElement) {
            updateStageModeUI(false);
        }
    } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleStageMode();
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

