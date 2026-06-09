import {
    ANIMAL_ASSET_BASE_PATH,
    FAVORITE_TUTORIAL_ANIMAL_ID,
    STARTER_ANIMAL_ID,
    UPGRADE_TUTORIAL_ANIMAL_ID,
    baseSeeds,
    initialAnimals,
    locations,
    symmetryTransforms,
    temps,
    times
} from "./data.js";
import {
    ZOO_IDLE_COLLECTION_CAP_HOURS,
    calculateZooIdleCoins,
    calculateTotalPower,
    canUpgradeAnimal,
    computeProgressionForLevel,
    generateEnvironmentalZoneAssignments,
    getAnimalCollectedShards,
    getAnimalShardProgress,
    getAnimalUpgradeCoinCost,
    getZooIdleRatePerMinute,
    getLevelDifficulty,
    getSolvedAnimalSummary,
    selectLevelLayout,
    solveBoard
} from "./logic.js?v=20260609e";
import { createGridSetupHelpers } from "./grid-setup.js";
import { createPuzzleActionHelpers } from "./puzzle-actions.js";
import { cloneInitialAnimals, loadState, saveState, state } from "./state.js?v=20260609e";
import { createPuzzleInputHelpers } from "./puzzle-input.js";
import { createUiHelpers } from "./ui.js?v=20260609e";
import { createTutorialHelpers } from "./tutorials.js";
import { createTransitionHelpers } from "./transitions.js?v=20260609e";
import { bindUiEvents } from "./events.js?v=20260609e";

// ----------------- AUDIO ENGINE -----------------
let isAudioMuted = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (isAudioMuted) return;
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'tap') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'pop') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.35);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'win') {
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
            notes.forEach((freq, idx) => {
                const noteOsc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                noteOsc.connect(noteGain);
                noteGain.connect(audioCtx.destination);
                noteOsc.type = 'triangle';
                noteOsc.frequency.setValueAtTime(freq, now + idx * 0.1);
                noteGain.gain.setValueAtTime(0.1, now + idx * 0.1);
                noteGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
                noteOsc.start(now + idx * 0.1);
                noteOsc.stop(now + idx * 0.1 + 0.3);
            });
        } else if (type === 'levelup') {
            const notes = [349.23, 440.00, 523.25, 587.33, 698.46];
            notes.forEach((freq, idx) => {
                const noteOsc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                noteOsc.connect(noteGain);
                noteGain.connect(audioCtx.destination);
                noteOsc.type = 'sine';
                noteOsc.frequency.setValueAtTime(freq, now + idx * 0.07);
                noteGain.gain.setValueAtTime(0.15, now + idx * 0.07);
                noteGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.07 + 0.4);
                noteOsc.start(now + idx * 0.07);
                noteOsc.stop(now + idx * 0.07 + 0.45);
            });
        }
    } catch (e) {
        console.log('Audio Context skipped.');
    }
}

let gridSetupHelpers = null;
let transitionHelpers = null;

function getActiveLevelData() {
    return gridSetupHelpers?.getActiveLevelData() || {};
}

function getCorrectPlacements() {
    return gridSetupHelpers?.getCorrectPlacements() || [];
}

function initGrid() {
    gridSetupHelpers?.initGrid();
}

function ensureCurrentPuzzleLevelLoaded() {
    return gridSetupHelpers?.ensureCurrentPuzzleLevelLoaded() ?? false;
}

function confirmFierceWarning() {
    gridSetupHelpers?.confirmFierceWarning();
}

function checkMainHomeScreenUnlocks() {
    transitionHelpers?.checkMainHomeScreenUnlocks?.();
}

function getAnimalSpriteId(animalOrId) {
    const animal = typeof animalOrId === 'string'
        ? state.animals.find(entry => entry.id === animalOrId) || initialAnimals.find(entry => entry.id === animalOrId)
        : animalOrId;
    return animal?.assetId || animal?.id || STARTER_ANIMAL_ID;
}

function getAnimalName(animalId) {
    return state.animals.find(entry => entry.id === animalId)?.name
        || initialAnimals.find(entry => entry.id === animalId)?.name
        || animalId;
}

function animalHeadMarkup(animalOrId, sizeClass = 'animal-head--md', extraClass = '', expression = 'neutral') {
    const spriteId = getAnimalSpriteId(animalOrId);
    const label = typeof animalOrId === 'string'
        ? getAnimalName(animalOrId)
        : (animalOrId?.name || spriteId);
    const classes = ['animal-head', sizeClass, extraClass].filter(Boolean).join(' ');
    return `<span class="${classes}" role="img" aria-label="${label}"><img class="animal-head__image" src="${ANIMAL_ASSET_BASE_PATH}/${spriteId}.png" alt="${label}" loading="eager" decoding="async" draggable="false"></span>`;
}

function getMascotArt(mascotId = state.favoriteMascot) {
    return animalHeadMarkup(mascotId, 'animal-head--sm');
}

function parseHexChannel(value) {
    return Number.parseInt(value, 16);
}

function getCellBackgroundColor(r, c) {
    const activeLevelData = getActiveLevelData();
    const zoneId = activeLevelData.colorMap?.[r]?.[c];
    return activeLevelData.colors?.[zoneId] || '#ffffff';
}

function getMarkerInkColor(bgColor) {
    if (typeof bgColor !== 'string' || !bgColor.startsWith('#')) {
        return '#0f172a';
    }

    const hex = bgColor.slice(1);
    const normalized = hex.length === 3
        ? hex.split('').map(char => char + char).join('')
        : hex;

    if (normalized.length !== 6) {
        return '#0f172a';
    }

    const r = parseHexChannel(normalized.slice(0, 2));
    const g = parseHexChannel(normalized.slice(2, 4));
    const b = parseHexChannel(normalized.slice(4, 6));
    const luminance = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return luminance > 186 ? '#0f172a' : '#f8fafc';
}

function getAvailableZooUpgradeCount() {
    return state.animals.filter(animal => (
        state.unlockedCompanionIds.includes(animal.id) &&
        canUpgradeAnimal(animal, state.coins, {
            tutorialFree: !state.tutorialComplete && state.tutorialStep === 2 && animal.id === UPGRADE_TUTORIAL_ANIMAL_ID
        })
    )).length;
}

const {
    clearBoard,
    getLevelHintUses,
    getLevelRevealUses,
    resetLevelPowerUpUses,
    useLogicalExclusions,
    useRevealSpecies
} = createPuzzleActionHelpers({
    state,
    getActiveLevelData,
    getCorrectPlacements,
    playSound,
    updateCellVisual: (r, c) => updateCellVisual(r, c),
    renderChecklistHUD: () => renderChecklistHUD(),
    updateProgressText: () => updateProgressText(),
    showFloatAlert: message => showFloatAlert(message),
    updateHUD: () => updateHUD(),
    updatePowerUpCostsBadge: () => updatePowerUpCostsBadge(),
    saveState,
    validatePuzzleBoard: () => validatePuzzleBoard()
});

const {
    collectZooEarnings,
    getCurrentZooEarnings,
    hideProgressionOverlay,
    populateSettingsLevelControls,
    renderChecklistHUD,
    renderHomeScreen,
    renderZooHabitat,
    setZooWelcomeVisibility,
    showFloatAlert,
    showProgressionOverlay,
    showTooltip,
    startChestSparkles,
    stopChestSparkles,
    syncHomeUnlockUI,
    syncZooUnlockUI,
    toggleHowToPlay,
    toggleSettingsMenu,
    triggerConfetti,
    updateCellVisual,
    updateHeaderLogoVisibility,
    updateHeartsUI,
    updateHUD,
    updatePowerUpCostsBadge,
    updateProgressText
} = createUiHelpers({
    state,
    favoriteTutorialAnimalId: FAVORITE_TUTORIAL_ANIMAL_ID,
    upgradeTutorialAnimalId: UPGRADE_TUTORIAL_ANIMAL_ID,
    canUpgradeAnimal,
    calculateZooIdleCoins,
    getAnimalCollectedShards,
    getAnimalShardProgress,
    getAnimalUpgradeCoinCost,
    getActiveLevelData,
    getAvailableZooUpgradeCount,
    getLevelRevealUses,
    getLevelHintUses,
    animalHeadMarkup,
    getMarkerInkColor,
    getCellBackgroundColor,
    getLevelLocationIcon,
    getDifficultyIcon,
    getTimeIcon,
    getTempIcon,
    getMascotArt,
    getZooIdleRatePerMinute,
    zooIdleCapHours: ZOO_IDLE_COLLECTION_CAP_HOURS,
    calculateTotalPower,
    playSound
});

const {
    advanceZooTutorial,
    handleGameFtueDragMark,
    handleGameFtueTap,
    onTutorialPrimaryAction,
    positionCoachmark,
    resetTutorialState,
    startGameFtue,
    startGuidedTutorial
} = createTutorialHelpers({
    state,
    favoriteTutorialAnimalId: FAVORITE_TUTORIAL_ANIMAL_ID,
    upgradeTutorialAnimalId: UPGRADE_TUTORIAL_ANIMAL_ID,
    getAnimalName,
    getActiveLevelData,
    getCorrectPlacements,
    saveState,
    playSound,
    showFloatAlert,
    updateCellVisual,
    renderChecklistHUD,
    updateProgressText
});

const {
    bindGridCell,
    bindPuzzlePointerEvents,
    resetPuzzleInputState,
    validatePuzzleBoard
} = createPuzzleInputHelpers({
    state,
    getActiveLevelData,
    getCorrectPlacements,
    handleGameFtueTap,
    handleGameFtueDragMark,
    playSound,
    updateCellVisual,
    updateHeartsUI,
    renderChecklistHUD,
    updateProgressText,
    triggerConfetti,
    onLevelComplete: levelComplete
});

function resetTransientUi() {
    ['progression-modal', 'chest-opening-modal', 'game-over-modal', 'how-to-play-modal', 'settings-modal'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });

    const progressionModal = document.getElementById('progression-modal');
    const progressionMask = document.getElementById('progression-mask');
    const progressionCard = document.getElementById('progression-card');
    if (progressionModal) {
        progressionModal.classList.remove('opacity-100');
        progressionModal.classList.add('opacity-0', 'pointer-events-none');
    }
    if (progressionMask) {
        progressionMask.classList.remove('level-win-mask--show');
    }
    if (progressionCard) {
        progressionCard.classList.remove('level-win-card--show');
        progressionCard.style.opacity = '';
        progressionCard.style.transform = '';
    }

    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) tutorialOverlay.classList.add('hidden');
    resetTutorialState();

    stopChestSparkles();
    resetPuzzleInputState();
}

transitionHelpers = createTransitionHelpers({
    state,
    favoriteTutorialAnimalId: FAVORITE_TUTORIAL_ANIMAL_ID,
    upgradeTutorialAnimalId: UPGRADE_TUTORIAL_ANIMAL_ID,
    canUpgradeAnimal,
    getAnimalCollectedShards,
    getAnimalShardProgress,
    getAnimalUpgradeCoinCost,
    initialAnimals,
    starterAnimalId: STARTER_ANIMAL_ID,
    cloneInitialAnimals,
    saveState,
    computeProgressionForLevel,
    resetTransientUi,
    syncHomeUnlockUI,
    syncZooUnlockUI,
    setZooWelcomeVisibility,
    renderZooHabitat,
    renderHomeScreen,
    updateHUD,
    initGrid,
    ensureCurrentPuzzleLevelLoaded,
    updateHeaderLogoVisibility,
    renderChecklistHUD,
    stopChestSparkles,
    hideProgressionOverlay,
    startGuidedTutorial,
    toggleSettingsMenu,
    playSound,
    showFloatAlert,
    animalHeadMarkup,
    advanceZooTutorial,
    refreshZooTutorial: () => positionCoachmark()
});

const {
    applyLevelSelection,
    applySelectedLevelFromSettings,
    checkZooUnlockingProgress,
    finishZooWelcome,
    jumpToZooUnlockFtue,
    onCloseChestAndUnlock,
    onNextProgressStep,
    replayIntroFtue,
    switchTab,
    toggleFavoriteMascot,
    triggerChestOpeningSequence,
    upgradeAnimal
} = transitionHelpers;

gridSetupHelpers = createGridSetupHelpers({
    state,
    baseSeeds,
    symmetryTransforms,
    locations,
    times,
    temps,
    starterAnimalId: STARTER_ANIMAL_ID,
    getLevelDifficulty,
    selectLevelLayout,
    solveBoard,
    generateEnvironmentalZoneAssignments,
    resetLevelPowerUpUses,
    resetPuzzleInputState,
    updateHeartsUI,
    bindGridCell,
    updateCellVisual,
    renderChecklistHUD,
    updateProgressText,
    updateHUD,
    checkMainHomeScreenUnlocks,
    startGameFtue,
    playSound
});

// ----------------- ECONOMY & PROGRESSION SYSTEM -----------------
function levelComplete(finalAnimals) {
    const rewardCoins = 50;
    const solvedAnimalSummary = getSolvedAnimalSummary(finalAnimals, state.levelZoneAssignments, state.animals, initialAnimals);
    solvedAnimalSummary.forEach(({ animal, count }) => {
        if (!animal) return;
        animal.shardsCollected = getAnimalCollectedShards(animal) + count;
    });

    state.chestProgress++;
    
    saveState();
    updateHUD();
    renderZooHabitat();

    showProgressionOverlay(solvedAnimalSummary, {
        coinReward: rewardCoins,
        autoCollectReward: true,
        onRewardCollected: () => {
            saveState();
            updateHUD();
        }
    });
}

function restartCurrentLevel() {
    document.getElementById('game-over-modal')?.classList.add('hidden');
    initGrid();
}

function prevLevel() {
    if (state.currentLevelNumber > 1) {
        playSound('tap');
        state.currentLevelNumber--;
        initGrid();
    }
}

function nextLevel() {
    playSound('tap');
    state.currentLevelNumber++;
    initGrid();
}

function toggleAudioMute() {
    playSound('tap');
    isAudioMuted = !isAudioMuted;
    const btn = document.getElementById('btn-toggle-sfx');
    if (!btn) return;

    if (isAudioMuted) {
        btn.innerText = "MUTED";
        btn.className = "px-3.5 py-1.5 rounded-xl font-bold bg-slate-500 text-white";
    } else {
        btn.innerText = "ENABLED";
        btn.className = "px-3.5 py-1.5 rounded-xl font-bold gold-coin-badge text-white";
    }
}

async function handleCollectZooEarnings() {
    const claimedAt = Date.now();
    const availableCoins = getCurrentZooEarnings(claimedAt);
    if (availableCoins <= 0) return;

    playSound('win');
    await collectZooEarnings(availableCoins, () => {
        state.zooEarningsLastCollectedAt = claimedAt;
        saveState();
        updateHUD();
        renderHomeScreen();
    });
}

function getLevelLocationIcon(location) {
    const iconMap = {
        JUNGLE: "tiger",
        SAVANNA: "lion",
        ARCTIC: "polar_bear",
        FOREST: "wolf",
        DESERT: "cobra"
    };
    return animalHeadMarkup(iconMap[location] || STARTER_ANIMAL_ID, 'animal-head--tiny');
}

function getDifficultyIcon(difficulty) {
    const iconMap = {
        EASY: "🟢",
        HARD: "🟠",
        "VERY HARD": "🔴"
    };
    return iconMap[difficulty] || "🟢";
}

function getTimeIcon(time) {
    return time === "NIGHT" ? "🌙" : "☀️";
}

function getTempIcon(temp) {
    const iconMap = {
        HOT: "🔥",
        COLD: "🧊",
        MODERATE: "🍃"
    };
    return iconMap[temp] || "🍃";
}

function getTooltipDetails(kind) {
    const activeLevelData = getActiveLevelData();
    if (!activeLevelData) return null;

    if (kind === 'location') {
        return { title: '📍 Location', text: activeLevelData.location };
    }
    if (kind === 'time') {
        return { title: '⏰ Time', text: activeLevelData.time };
    }
    if (kind === 'temp') {
        return { title: '🌡️ Temperature', text: activeLevelData.temp };
    }
    return null;
}

if (new URLSearchParams(window.location.search).has("self-test")) {
    window.__zoodokuTestApi = {
        applyLevelSelection,
        getCorrectPlacements: () => getCorrectPlacements(),
        getGridValue: (row, col) => state.gridState?.[row]?.[col]
    };
}

document.addEventListener("DOMContentLoaded", () => {
    bindPuzzlePointerEvents();
    bindUiEvents({
        getTooltipDetails,
        handlers: {
            applySelectedLevelFromSettings,
            collectZooEarnings: handleCollectZooEarnings,
            confirmFierceWarning,
            finishZooWelcome,
            jumpToZooUnlockFtue,
            onCloseChestAndUnlock,
            onNextProgressStep,
            onTutorialPrimaryAction,
            replayIntroFtue,
            restartCurrentLevel,
            showTooltip,
            switchTab,
            toggleAudioMute,
            toggleFavoriteMascot,
            toggleHowToPlay,
            toggleSettingsMenu,
            upgradeAnimal,
            useLogicalExclusions,
            useRevealSpecies
        }
    });
    loadState();
    syncHomeUnlockUI();
    syncZooUnlockUI();
    setZooWelcomeVisibility(!state.zooWelcomeSeen);
    renderZooHabitat();
    updateHUD();
    initGrid();
    renderHomeScreen();
    updateHeaderLogoVisibility('puzzle');

    window.setInterval(() => {
        renderHomeScreen();
    }, 5000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            renderHomeScreen();
        }
    });
});
