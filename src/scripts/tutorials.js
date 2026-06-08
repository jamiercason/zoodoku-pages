export function createTutorialHelpers({
    state,
    favoriteTutorialAnimalId,
    upgradeTutorialAnimalId,
    getAnimalName,
    getActiveLevelData,
    getCorrectPlacements,
    saveState,
    playSound,
    showFloatAlert,
    updateCellVisual,
    renderChecklistHUD,
    updateProgressText
}) {
    let activeTutorialMode = null;
    let gameFtueStep = 0;
    let gameFtueTargets = { clue: null, mark: null, place: null };
    const tutorialDialogBaseClass = 'tutorial-top-card rounded-3xl p-5 border-4 shadow-2xl flex flex-col space-y-3 pointer-events-auto transition-all duration-300';

    function clearTutorialHighlights() {
        document.querySelectorAll('.tutorial-highlighted').forEach(element => {
            element.classList.remove('tutorial-highlighted', 'z-[50]', 'z-[55]', 'z-[70]', 'ring-4', 'ring-amber-400', 'rounded-2xl', 'shadow-2xl', 'bg-white', 'tutorial-board-cell');
        });
        document.querySelectorAll('.onboarding-hand').forEach(hand => hand.classList.add('hidden'));
        const boardHand = document.getElementById('tutorial-board-hand');
        if (boardHand) {
            boardHand.classList.add('hidden');
            boardHand.style.left = '';
            boardHand.style.top = '';
        }
    }

    function hideTutorialOverlay() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
        clearTutorialHighlights();
        activeTutorialMode = null;
    }

    function resetTutorialState() {
        hideTutorialOverlay();
        gameFtueStep = 0;
        gameFtueTargets = { clue: null, mark: null, place: null };
    }

    function setTutorialHeader(mode, titleText) {
        const avatar = document.getElementById('tutorial-guide-avatar');
        const brandLogo = document.getElementById('tutorial-brand-logo');
        const title = document.getElementById('tutorial-title');
        if (!avatar || !brandLogo || !title) return;

        if (mode === 'game') {
            avatar.classList.add('hidden');
            brandLogo.classList.remove('hidden');
            title.className = 'text-sm font-black text-emerald-700 uppercase leading-none tracking-[0.16em]';
        } else {
            avatar.classList.remove('hidden');
            brandLogo.classList.add('hidden');
            title.className = 'text-sm font-black text-indigo-700 uppercase leading-none';
        }

        title.innerText = titleText;
    }

    function applyTutorialDialogWindow(mode) {
        const windowEl = document.getElementById('tutorial-dialogue-window');
        if (!windowEl) return;

        const accentClass = mode === 'game' ? 'border-emerald-400 bg-white/98' : 'border-amber-400 bg-white';
        windowEl.className = `${tutorialDialogBaseClass} ${accentClass}`;
    }

    function positionTutorialHandForCell(cellId, placement = 'below') {
        const hand = document.getElementById('tutorial-board-hand');
        const cell = document.getElementById(cellId);
        const gameView = document.getElementById('game-view');
        if (!hand || !cell || !gameView) return;

        const cellRect = cell.getBoundingClientRect();
        const gameViewRect = gameView.getBoundingClientRect();
        hand.style.left = `${cellRect.left - gameViewRect.left + (cellRect.width / 2)}px`;
        const topPosition = placement === 'below'
            ? cellRect.top - gameViewRect.top + cellRect.height - 4
            : cellRect.top - gameViewRect.top - 18;
        hand.style.top = `${topPosition}px`;
        hand.classList.remove('hidden');
    }

    function computeGameFtueTargets() {
        const correctPlacements = getCorrectPlacements();
        const activeLevelData = getActiveLevelData();
        const clue = correctPlacements.find(([r, c]) => state.gridState[r][c] === 2) || correctPlacements[0] || null;
        const solutionKeys = new Set(correctPlacements.map(([r, c]) => `${r}-${c}`));
        const size = activeLevelData.gridSize || 0;

        let mark = null;
        if (clue) {
            const [clueRow, clueCol] = clue;
            const nearbyCandidates = [
                [clueRow, clueCol - 1],
                [clueRow, clueCol + 1],
                [clueRow + 1, clueCol],
                [clueRow + 1, clueCol + 1]
            ];

            mark = nearbyCandidates.find(([r, c]) => (
                r >= 0 &&
                c >= 0 &&
                r < size &&
                c < size &&
                !solutionKeys.has(`${r}-${c}`)
            )) || null;
        }

        if (!mark) {
            for (let r = 0; r < size && !mark; r++) {
                for (let c = 0; c < size; c++) {
                    if (!solutionKeys.has(`${r}-${c}`)) {
                        mark = [r, c];
                        break;
                    }
                }
            }
        }

        const place = correctPlacements.find(([r, c]) => state.gridState[r][c] !== 2) || null;
        gameFtueTargets = { clue, mark, place };
    }

    function advanceGameFtueStep() {
        playSound('tap');
        if (gameFtueStep === 1 || gameFtueStep === 2) {
            gameFtueStep += 1;
            positionGameFtue();
            return;
        }

        if (gameFtueStep >= 5) {
            state.gameFtueComplete = true;
            saveState();
            hideTutorialOverlay();
        }
    }

    function startGameFtue() {
        const correctPlacements = getCorrectPlacements();
        if (state.gameFtueComplete || state.currentLevelNumber !== 1 || !correctPlacements.length) return;

        computeGameFtueTargets();
        activeTutorialMode = 'game';
        gameFtueStep = 1;

        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.remove('hidden');
        positionGameFtue();
    }

    function positionGameFtue() {
        const windowEl = document.getElementById('tutorial-dialogue-window');
        const text = document.getElementById('tutorial-coachmark-text');
        const stepInd = document.getElementById('tutorial-step-indicator');
        const dismissBtn = document.getElementById('tutorial-dismiss-btn');
        if (!windowEl || !text || !stepInd || !dismissBtn) return;

        clearTutorialHighlights();
        setTutorialHeader('game', gameFtueStep === 1 ? 'Welcome to Zoodoku' : 'Puzzle Basics');
        applyTutorialDialogWindow('game');

        if (gameFtueStep === 1) {
            text.innerHTML = 'Welcome to <strong>Zoodoku</strong>. Every puzzle hides one animal in each row, each column, and each colored habitat zone.';
            stepInd.innerText = 'Intro 1/5';
            dismissBtn.innerText = 'Start';
            dismissBtn.classList.remove('hidden');
        } else if (gameFtueStep === 2) {
            text.innerHTML = 'This glowing animal is your starting clue. Animals also cannot touch each other, even diagonally, so one clue helps rule out nearby spaces.';
            stepInd.innerText = 'Intro 2/5';
            dismissBtn.innerText = 'Next';
            dismissBtn.classList.remove('hidden');

            if (gameFtueTargets.clue) {
                const [r, c] = gameFtueTargets.clue;
                const clueCell = document.getElementById(`cell-${r}-${c}`);
                if (clueCell) clueCell.classList.add('tutorial-highlighted', 'tutorial-board-cell');
            }
        } else if (gameFtueStep === 3) {
            text.innerHTML = 'Tap the glowing square <strong>once</strong> to place an X marker. X marks mean an animal cannot go there.';
            stepInd.innerText = 'Intro 3/5';
            dismissBtn.classList.add('hidden');

            if (gameFtueTargets.mark) {
                const [r, c] = gameFtueTargets.mark;
                const markCell = document.getElementById(`cell-${r}-${c}`);
                if (markCell) {
                    markCell.classList.add('tutorial-highlighted', 'tutorial-board-cell');
                    positionTutorialHandForCell(`cell-${r}-${c}`, 'below');
                }
            }
        } else if (gameFtueStep === 4) {
            text.innerHTML = 'Great. Now <strong>double-tap</strong> the glowing square to place an animal when you are confident it belongs there.';
            stepInd.innerText = 'Intro 4/5';
            dismissBtn.classList.add('hidden');

            if (gameFtueTargets.place) {
                const [r, c] = gameFtueTargets.place;
                const placeCell = document.getElementById(`cell-${r}-${c}`);
                if (placeCell) {
                    placeCell.classList.add('tutorial-highlighted', 'tutorial-board-cell');
                    positionTutorialHandForCell(`cell-${r}-${c}`, 'below');
                }
            }
        } else {
            text.innerHTML = 'Perfect. Keep using clues, X markers, and careful placements to finish the board and rescue every animal.';
            stepInd.innerText = 'Intro 5/5';
            dismissBtn.innerText = "Let's Play";
            dismissBtn.classList.remove('hidden');
        }
    }

    function handleGameFtueTap(r, c, diff, currentVal) {
        if (activeTutorialMode !== 'game') return false;

        const key = `${r}-${c}`;
        const markKey = gameFtueTargets.mark ? `${gameFtueTargets.mark[0]}-${gameFtueTargets.mark[1]}` : null;
        const placeKey = gameFtueTargets.place ? `${gameFtueTargets.place[0]}-${gameFtueTargets.place[1]}` : null;

        if (gameFtueStep < 3 || gameFtueStep > 4) {
            showFloatAlert('Follow the tutorial card to continue.');
            return true;
        }

        if (gameFtueStep === 3) {
            if (key !== markKey) {
                showFloatAlert('Tap the glowing square once to add an X.');
                playSound('error');
                return true;
            }

            if (currentVal !== 1) {
                state.gridState[r][c] = 1;
                playSound('tap');
                updateCellVisual(r, c);
            }

            gameFtueStep = 4;
            setTimeout(positionGameFtue, 140);
            return true;
        }

        if (key !== placeKey) {
            showFloatAlert('Double-tap the glowing square to place the animal.');
            if (diff < 300) playSound('error');
            return true;
        }

        if (diff < 300) {
            state.gridState[r][c] = 2;
            playSound('pop');
            updateCellVisual(r, c);
            renderChecklistHUD();
            updateProgressText();
            gameFtueStep = 5;
            setTimeout(positionGameFtue, 180);
        } else {
            showFloatAlert('Double-tap this glowing square.');
        }

        return true;
    }

    function handleGameFtueDragMark(r, c) {
        if (activeTutorialMode !== 'game') return false;

        const key = `${r}-${c}`;
        const markKey = gameFtueTargets.mark ? `${gameFtueTargets.mark[0]}-${gameFtueTargets.mark[1]}` : null;

        if (gameFtueStep < 3 || gameFtueStep > 4) {
            showFloatAlert('Follow the tutorial card to continue.');
            return true;
        }

        if (gameFtueStep === 3) {
            if (key !== markKey) {
                showFloatAlert('Drag across the glowing square to add the X.');
                return true;
            }

            if (state.gridState[r][c] !== 1) {
                state.gridState[r][c] = 1;
                playSound('tap');
                updateCellVisual(r, c);
            }

            gameFtueStep = 4;
            setTimeout(positionGameFtue, 140);
            return true;
        }

        showFloatAlert('Double-tap the glowing square to place the animal.');
        return true;
    }

    function startGuidedTutorial() {
        activeTutorialMode = 'zoo';
        state.tutorialStep = 1;
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.remove('hidden');
        positionCoachmark();
    }

    function positionCoachmark() {
        const windowEl = document.getElementById('tutorial-dialogue-window');
        const text = document.getElementById('tutorial-coachmark-text');
        const stepInd = document.getElementById('tutorial-step-indicator');
        const dismissBtn = document.getElementById('tutorial-dismiss-btn');
        if (!windowEl || !text || !stepInd || !dismissBtn) return;

        clearTutorialHighlights();
        setTutorialHeader('zoo', 'Zoo Guide');
        applyTutorialDialogWindow('zoo');

        if (state.tutorialStep === 1) {
            text.innerHTML = `This is your Zoo Park! Tap the <strong>🌟 Fav</strong> button on the <strong>${getAnimalName(favoriteTutorialAnimalId)} card</strong>. This boosts its chance of appearing in levels with matching environments.`;
            stepInd.innerText = 'Step 1/3';
            dismissBtn.classList.add('hidden');

            const favoriteTutorialCard = document.getElementById(`animal-card-${favoriteTutorialAnimalId}`);
            if (favoriteTutorialCard) {
                favoriteTutorialCard.classList.add('tutorial-highlighted', 'z-[70]', 'relative', 'ring-4', 'ring-amber-400', 'rounded-2xl', 'shadow-2xl', 'bg-white');
                const hand = document.getElementById('hand-favorite-tutorial');
                if (hand) hand.classList.remove('hidden');
            }
        } else if (state.tutorialStep === 2) {
            text.innerHTML = `Perfect choice! Now click <strong>🔼 Level Up</strong> on your <strong>${getAnimalName(upgradeTutorialAnimalId)} card</strong>. To finish this tutorial, that first upgrade is <strong>FREE</strong>.`;
            stepInd.innerText = 'Step 2/3';
            dismissBtn.classList.add('hidden');

            const upgradeTutorialCard = document.getElementById(`animal-card-${upgradeTutorialAnimalId}`);
            if (upgradeTutorialCard) {
                upgradeTutorialCard.classList.add('tutorial-highlighted', 'z-[70]', 'relative', 'ring-4', 'ring-amber-400', 'rounded-2xl', 'shadow-2xl', 'bg-white');
                const hand = document.getElementById('hand-upgrade-tutorial');
                if (hand) hand.classList.remove('hidden');
            }
        } else if (state.tutorialStep === 3) {
            text.innerHTML = 'Unlock more animals by solving logic puzzles. Have fun building your dream animal park, Ranger!';
            stepInd.innerText = 'Step 3/3';
            dismissBtn.classList.remove('hidden');
        }
    }

    function advanceZooTutorial() {
        playSound('tap');
        state.tutorialStep += 1;
        if (state.tutorialStep > 3) {
            hideTutorialOverlay();

            const zooContainer = document.getElementById('main-view-container');
            if (zooContainer) {
                zooContainer.classList.remove('overflow-hidden', 'max-h-full');
                zooContainer.classList.add('overflow-y-auto');
            }

            state.tutorialComplete = true;
            saveState();
            return;
        }

        positionCoachmark();
    }

    function onTutorialPrimaryAction() {
        if (activeTutorialMode === 'game') {
            advanceGameFtueStep();
            return;
        }

        advanceZooTutorial();
    }

    return {
        advanceZooTutorial,
        handleGameFtueDragMark,
        handleGameFtueTap,
        onTutorialPrimaryAction,
        resetTutorialState,
        startGameFtue,
        startGuidedTutorial
    };
}
