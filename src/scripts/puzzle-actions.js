export function createPuzzleActionHelpers({
    state,
    getActiveLevelData,
    getCorrectPlacements,
    playSound,
    updateCellVisual,
    renderChecklistHUD,
    updateProgressText,
    showFloatAlert,
    updateHUD,
    updatePowerUpCostsBadge,
    saveState,
    validatePuzzleBoard
}) {
    let levelRevealUses = 0;
    let levelHintUses = 0;

    function getLevelRevealUses() {
        return levelRevealUses;
    }

    function getLevelHintUses() {
        return levelHintUses;
    }

    function resetLevelPowerUpUses() {
        levelRevealUses = 0;
        levelHintUses = 0;
        updatePowerUpCostsBadge();
    }

    function clearBoard() {
        playSound('tap');
        const size = getActiveLevelData().gridSize;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (state.gridState[r][c] !== 2) {
                    state.gridState[r][c] = 0;
                    updateCellVisual(r, c);
                }
            }
        }

        renderChecklistHUD();
        updateProgressText();
    }

    function useRevealSpecies() {
        const cost = 50 * Math.pow(2, levelRevealUses);
        if (state.coins < cost) {
            showFloatAlert("Need more coins!");
            playSound('error');
            return;
        }

        const correctPlacements = getCorrectPlacements();
        const unplacedSolCoords = correctPlacements.filter(([sr, sc]) => state.gridState[sr][sc] !== 2);

        if (unplacedSolCoords.length === 0) {
            showFloatAlert("Board already solved!");
            return;
        }

        state.coins -= cost;
        levelRevealUses++;
        playSound('pop');

        const [hr, hc] = unplacedSolCoords[Math.floor(Math.random() * unplacedSolCoords.length)];
        const size = getActiveLevelData().gridSize;

        for (let r = 0; r < size; r++) {
            if (state.gridState[r][hc] !== 2) state.gridState[r][hc] = 0;
            updateCellVisual(r, hc);
        }
        for (let c = 0; c < size; c++) {
            if (state.gridState[hr][c] !== 2) state.gridState[hr][c] = 0;
            updateCellVisual(hr, c);
        }

        state.gridState[hr][hc] = 2;
        updateCellVisual(hr, hc);

        validatePuzzleBoard();
        renderChecklistHUD();
        updateProgressText();
        updateHUD();
        updatePowerUpCostsBadge();
        saveState();
    }

    function useLogicalExclusions() {
        const cost = 30 * Math.pow(2, levelHintUses);
        if (state.coins < cost) {
            showFloatAlert("Need more coins!");
            playSound('error');
            return;
        }

        const correctPlacements = getCorrectPlacements();
        const size = getActiveLevelData().gridSize;
        const emptyCorrectCells = [];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const isSolution = correctPlacements.some(([sr, sc]) => sr === r && sc === c);
                if (!isSolution && state.gridState[r][c] === 0) {
                    emptyCorrectCells.push([r, c]);
                }
            }
        }

        if (emptyCorrectCells.length === 0) {
            showFloatAlert("No exclusions available!");
            return;
        }

        state.coins -= cost;
        levelHintUses++;
        playSound('pop');

        const targetCount = Math.min(3, emptyCorrectCells.length);
        for (let i = 0; i < targetCount; i++) {
            const pickIndex = Math.floor(Math.random() * emptyCorrectCells.length);
            const [r, c] = emptyCorrectCells.splice(pickIndex, 1)[0];
            state.gridState[r][c] = 1;
            updateCellVisual(r, c);
        }

        renderChecklistHUD();
        updateProgressText();
        updateHUD();
        updatePowerUpCostsBadge();
        saveState();
    }

    return {
        clearBoard,
        getLevelHintUses,
        getLevelRevealUses,
        resetLevelPowerUpUses,
        useLogicalExclusions,
        useRevealSpecies
    };
}
