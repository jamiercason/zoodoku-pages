export function createGridSetupHelpers({
    state,
    baseSeeds,
    symmetryTransforms,
    locations,
    times,
    temps,
    starterAnimalId,
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
}) {
    let activeLevelData = {};
    let correctPlacements = [];
    let fierceWarningTimer = null;
    let pendingGridBuildAfterWarning = false;

    function getActiveLevelData() {
        return activeLevelData;
    }

    function getCorrectPlacements() {
        return correctPlacements;
    }

    function ensureCurrentPuzzleLevelLoaded() {
        const activeGridMatchesLevel = activeLevelData.id === state.currentLevelNumber
            && Array.isArray(state.gridState)
            && state.gridState.length === activeLevelData.gridSize;

        if (activeGridMatchesLevel) return false;

        initGrid();
        return true;
    }

    function initGrid() {
        const lvlNum = state.currentLevelNumber;
        const difficulty = getLevelDifficulty(lvlNum);
        const selectedLayout = selectLevelLayout(lvlNum, difficulty, baseSeeds, symmetryTransforms);

        activeLevelData = {
            id: lvlNum,
            gridSize: selectedLayout.gridSize,
            colors: selectedLayout.colors,
            colorMap: selectedLayout.colorMap,
            location: locations[lvlNum % locations.length],
            time: times[lvlNum % times.length],
            temp: temps[lvlNum % temps.length],
            difficulty
        };

        resetLevelPowerUpUses();
        applyDifficultyTheme();

        if (difficulty === "HARD" || difficulty === "VERY HARD") {
            triggerFierceBeastWarning();
        } else {
            buildActiveGrid();
        }
    }

    function triggerFierceBeastWarning() {
        playSound('error');
        const modal = document.getElementById('fierce-warning-modal');
        const title = document.getElementById('fierce-warning-title');
        const copy = document.getElementById('fierce-warning-copy');
        if (!modal || !title || !copy) {
            buildActiveGrid();
            return;
        }

        if (fierceWarningTimer) {
            clearTimeout(fierceWarningTimer);
            fierceWarningTimer = null;
        }

        if (activeLevelData.difficulty === "VERY HARD") {
            title.innerText = "Very Hard Level";
            copy.innerText = "Danger ahead. Expect a larger, meaner puzzle.";
        } else {
            title.innerText = "Hard Level";
            copy.innerText = "Stay sharp. This puzzle hits harder.";
        }

        modal.classList.remove('hidden', 'fierce-warning-hide');
        modal.classList.add('fierce-warning-show');
        modal.classList.remove('pointer-events-none');
        pendingGridBuildAfterWarning = true;

        const tensionVignette = document.getElementById('tension-overlay-border');
        tensionVignette?.classList.add('tension-vignette', 'ring-8', 'ring-red-500/80');
    }

    function confirmFierceWarning() {
        const modal = document.getElementById('fierce-warning-modal');
        if (!modal) return;

        modal.classList.remove('fierce-warning-show');
        modal.classList.add('fierce-warning-hide', 'pointer-events-none');

        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('fierce-warning-hide');
            if (pendingGridBuildAfterWarning) {
                pendingGridBuildAfterWarning = false;
                buildActiveGrid();
            }
        }, 340);
    }

    function applyDifficultyTheme() {
        const puzzleView = document.getElementById('view-puzzle');
        const tensionVignette = document.getElementById('tension-overlay-border');
        if (!puzzleView || !tensionVignette) return;

        const isHardMode = activeLevelData.difficulty === "HARD" || activeLevelData.difficulty === "VERY HARD";
        puzzleView.classList.toggle('hard-mode', isHardMode);
        puzzleView.classList.toggle('hard-mode--hard', activeLevelData.difficulty === "HARD");
        puzzleView.classList.toggle('hard-mode--very-hard', activeLevelData.difficulty === "VERY HARD");

        if (isHardMode) {
            tensionVignette.classList.add('tension-vignette', 'ring-8', 'ring-red-500/80');
        } else {
            tensionVignette.className = "absolute inset-0 pointer-events-none z-20 transition-all duration-500 rounded-3xl";
        }
    }

    function buildActiveGrid() {
        const size = activeLevelData.gridSize;
        state.gridState = Array(size).fill(null).map(() => Array(size).fill(0));
        state.hearts = 3;
        resetPuzzleInputState();
        updateHeartsUI();

        applyDifficultyTheme();

        const solutions = solveBoard(size, activeLevelData.colorMap);
        if (solutions.length > 0) {
            correctPlacements = solutions[0];
        } else {
            correctPlacements = [];
            for (let i = 0; i < size; i++) {
                correctPlacements.push([i, i]);
            }
        }

        if (state.currentLevelNumber === 1 && correctPlacements.length > 0) {
            const targetAnchor = correctPlacements[0];
            state.gridState[targetAnchor[0]][targetAnchor[1]] = 2;
        }

        state.levelZoneAssignments = generateEnvironmentalZoneAssignments({
            level: activeLevelData,
            totalZones: size,
            animals: state.animals,
            unlockedCompanionIds: state.unlockedCompanionIds,
            favoriteMascot: state.favoriteMascot,
            starterAnimalId: starterAnimalId
        });

        const gridContainer = document.getElementById('grid-container');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';

        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
        gridContainer.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;
        gridContainer.style.gap = '4px';

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.id = `cell-${r}-${c}`;

                const zoneId = activeLevelData.colorMap[r][c];
                const bgColor = activeLevelData.colors[zoneId] || '#ffffff';
                cell.style.backgroundColor = bgColor;
                cell.dataset.row = String(r);
                cell.dataset.col = String(c);
                cell.dataset.cellKey = `${r}-${c}`;

                cell.className = "zoodoku-grid-cell relative rounded-xl border border-slate-900/10 cursor-pointer flex items-center justify-center transition duration-200 select-none overflow-hidden aspect-square shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]";

                bindGridCell(cell, r, c);

                gridContainer.appendChild(cell);
                updateCellVisual(r, c);
            }
        }

        renderChecklistHUD();
        updateProgressText();
        updateHUD();
        checkMainHomeScreenUnlocks();

        if (state.currentLevelNumber === 1 && !state.gameFtueComplete) {
            setTimeout(() => {
                startGameFtue();
            }, 120);
        }
    }

    return {
        confirmFierceWarning,
        ensureCurrentPuzzleLevelLoaded,
        getActiveLevelData,
        getCorrectPlacements,
        initGrid
    };
}
