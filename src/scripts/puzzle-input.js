export function createPuzzleInputHelpers({
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
    onLevelComplete
}) {
    let gridLocked = false;
    let lastTapTimes = {};
    let activeDragMark = null;
    let suppressTapUntil = 0;
    let documentPointerEventsBound = false;

    function resetPuzzleInputState() {
        gridLocked = false;
        lastTapTimes = {};
        activeDragMark = null;
        suppressTapUntil = 0;
    }

    function markCellWithX(r, c, { toggle = false } = {}) {
        const currentVal = state.gridState[r][c];
        if (currentVal === 2) return false;

        if (toggle) {
            if (currentVal === 0) {
                state.gridState[r][c] = 1;
            } else if (currentVal === 1 || currentVal === 3) {
                state.gridState[r][c] = 0;
            } else {
                return false;
            }
        } else if (currentVal === 0 || currentVal === 3) {
            state.gridState[r][c] = 1;
        } else {
            return false;
        }

        playSound('tap');
        updateCellVisual(r, c);
        return true;
    }

    function beginDragMark(event, r, c) {
        if (gridLocked || (event.pointerType === 'mouse' && event.button !== 0)) return;

        activeDragMark = {
            pointerId: event.pointerId,
            originX: event.clientX,
            originY: event.clientY,
            originKey: `${r}-${c}`,
            markedKeys: new Set(),
            dragActivated: false
        };
    }

    function getCellCoordsFromElement(element) {
        const cell = element?.closest?.('[data-cell-key]');
        if (!cell) return null;

        return {
            key: cell.dataset.cellKey,
            row: Number.parseInt(cell.dataset.row, 10),
            col: Number.parseInt(cell.dataset.col, 10)
        };
    }

    function applyDragMarkToCell(r, c) {
        if (gridLocked) return false;

        if (handleGameFtueDragMark(r, c)) {
            return true;
        }

        return markCellWithX(r, c, { toggle: false });
    }

    function handleDragMarkMove(event) {
        if (!activeDragMark || event.pointerId !== activeDragMark.pointerId || gridLocked) return;

        const movedFarEnough = Math.hypot(
            event.clientX - activeDragMark.originX,
            event.clientY - activeDragMark.originY
        ) > 8;

        const hoveredCell = getCellCoordsFromElement(document.elementFromPoint(event.clientX, event.clientY));
        const enteredAnotherCell = hoveredCell && hoveredCell.key !== activeDragMark.originKey;

        if (!activeDragMark.dragActivated && !movedFarEnough && !enteredAnotherCell) {
            return;
        }

        activeDragMark.dragActivated = true;

        const cellsToMark = [];
        const [originRow, originCol] = activeDragMark.originKey.split('-').map(Number);
        cellsToMark.push({ key: activeDragMark.originKey, row: originRow, col: originCol });

        if (hoveredCell) {
            cellsToMark.push(hoveredCell);
        }

        cellsToMark.forEach(({ key, row, col }) => {
            if (activeDragMark.markedKeys.has(key)) return;
            const didMark = applyDragMarkToCell(row, col);
            if (didMark) {
                activeDragMark.markedKeys.add(key);
            }
        });
    }

    function endDragMark(event) {
        if (!activeDragMark || event.pointerId !== activeDragMark.pointerId) return;

        if (activeDragMark.dragActivated) {
            suppressTapUntil = performance.now() + 400;
        }

        activeDragMark = null;
    }

    function validatePuzzleBoard() {
        const activeLevelData = getActiveLevelData();
        const size = activeLevelData.gridSize;
        const animalsList = [];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (state.gridState[r][c] === 2) {
                    animalsList.push({ r, c, zone: activeLevelData.colorMap[r][c] });
                }
            }
        }

        if (animalsList.length === size) {
            gridLocked = true;
            triggerConfetti();
            playSound('win');
            onLevelComplete(animalsList);
        }
    }

    function deductHeart() {
        state.hearts--;
        updateHeartsUI();
    }

    function triggerErrorSequence(r, c) {
        gridLocked = true;
        playSound('error');

        const cell = document.getElementById(`cell-${r}-${c}`);
        if (!cell) {
            gridLocked = false;
            return;
        }

        state.gridState[r][c] = 3;
        updateCellVisual(r, c);

        cell.classList.add('wobble');

        const heartEl = document.createElement('span');
        heartEl.className = 'broken-heart-effect';
        heartEl.innerText = '💔';
        cell.appendChild(heartEl);

        deductHeart();

        setTimeout(() => {
            heartEl.remove();
            cell.classList.remove('wobble');

            gridLocked = false;
            renderChecklistHUD();
            updateProgressText();

            if (state.hearts <= 0) {
                setTimeout(() => {
                    document.getElementById('game-over-modal')?.classList.remove('hidden');
                }, 400);
            }
        }, 800);
    }

    function handleCellTap(r, c) {
        if (gridLocked) return;

        const now = Date.now();
        const key = `${r}-${c}`;
        const lastTap = lastTapTimes[key] || 0;
        const diff = now - lastTap;
        const currentVal = state.gridState[r][c];

        if (currentVal === 2) return;

        if (handleGameFtueTap(r, c, diff, currentVal)) {
            lastTapTimes[key] = now;
            return;
        }

        const correctPlacements = getCorrectPlacements();
        if (diff < 300) {
            const isCorrect = correctPlacements.some(([sr, sc]) => sr === r && sc === c);
            if (!isCorrect) {
                triggerErrorSequence(r, c);
            } else {
                state.gridState[r][c] = 2;
                playSound('pop');
                updateCellVisual(r, c);
                validatePuzzleBoard();
                renderChecklistHUD();
                updateProgressText();
            }
        } else {
            markCellWithX(r, c, { toggle: true });
        }

        lastTapTimes[key] = now;
    }

    function bindGridCell(cell, r, c) {
        cell.addEventListener('pointerdown', event => beginDragMark(event, r, c));
        cell.addEventListener('click', () => {
            if (performance.now() < suppressTapUntil) return;
            handleCellTap(r, c);
        });
    }

    function bindPuzzlePointerEvents() {
        if (documentPointerEventsBound) return;
        document.addEventListener('pointermove', handleDragMarkMove);
        document.addEventListener('pointerup', endDragMark);
        document.addEventListener('pointercancel', endDragMark);
        documentPointerEventsBound = true;
    }

    return {
        bindGridCell,
        bindPuzzlePointerEvents,
        resetPuzzleInputState,
        validatePuzzleBoard
    };
}
