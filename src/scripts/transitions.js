export function createTransitionHelpers({
    state,
    favoriteTutorialAnimalId,
    upgradeTutorialAnimalId,
    canUpgradeAnimal,
    getAnimalCollectedShards,
    getAnimalShardProgress,
    getAnimalUpgradeCoinCost,
    initialAnimals,
    starterAnimalId,
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
    refreshZooTutorial
}) {
    function finishZooWelcome() {
        state.zooWelcomeSeen = true;
        saveState();
        setZooWelcomeVisibility(false);
        renderZooHabitat();

        if (!state.tutorialComplete && state.tutorialStep === 0) {
            startGuidedTutorial();
        }
    }

    function applyLevelSelection(levelNumber, options = {}) {
        const progression = computeProgressionForLevel(levelNumber, initialAnimals, starterAnimalId);

        state.currentLevelNumber = progression.currentLevelNumber;
        state.chestGoal = progression.chestGoal;
        state.chestProgress = progression.chestProgress;
        state.zooEarningsLastCollectedAt = Date.now();
        state.unlockedCompanionIds = progression.unlockedCompanionIds;
        state.zooUnlocked = progression.zooUnlocked;
        state.coins = progression.coins;
        state.animals = cloneInitialAnimals();
        state.favoriteMascot = progression.unlockedCompanionIds.includes(state.favoriteMascot)
            ? state.favoriteMascot
            : progression.unlockedCompanionIds[0];
        if (options.gameFtue) state.gameFtueComplete = false;

        if (options.zooFtue) {
            state.zooWelcomeSeen = false;
            state.tutorialComplete = false;
            state.tutorialStep = 0;
        } else if (state.zooUnlocked) {
            state.zooWelcomeSeen = true;
            state.tutorialComplete = true;
            state.tutorialStep = 0;
        } else {
            state.zooWelcomeSeen = false;
            state.tutorialComplete = false;
            state.tutorialStep = 0;
        }

        resetTransientUi();
        syncHomeUnlockUI();
        syncZooUnlockUI();
        setZooWelcomeVisibility(!state.zooWelcomeSeen);
        saveState();
        renderZooHabitat();
        updateHUD();
        initGrid();

        if (options.openZoo) {
            switchTab('zoo');
        } else {
            switchTab('puzzle');
        }
    }

    function applySelectedLevelFromSettings() {
        const input = document.getElementById('settings-level-input');
        const value = input ? Number(input.value) : state.currentLevelNumber;
        applyLevelSelection(value);
    }

    function jumpToZooUnlockFtue() {
        applyLevelSelection(4, { zooFtue: true, openZoo: true });
    }

    function replayIntroFtue() {
        applyLevelSelection(1, { gameFtue: true });
        toggleSettingsMenu(false);
    }

    function switchTab(target) {
        playSound('tap');
        const viewPuzzle = document.getElementById('view-puzzle');
        const viewZoo = document.getElementById('view-zoo');
        const viewHome = document.getElementById('view-home');
        const tabBtnPuzzle = document.getElementById('tab-btn-puzzle');
        const tabBtnZoo = document.getElementById('tab-btn-zoo');
        const tabBtnHome = document.getElementById('tab-btn-home');

        [tabBtnPuzzle, tabBtnZoo, tabBtnHome].forEach(btn => {
            if (btn) btn.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 group";
        });
        syncHomeUnlockUI();
        syncZooUnlockUI();

        const zooContainer = document.getElementById('main-view-container');
        if (zooContainer) {
            if (target === 'zoo' && !state.tutorialComplete) {
                zooContainer.classList.add('overflow-hidden', 'max-h-full');
                zooContainer.classList.remove('overflow-y-auto');
            } else {
                zooContainer.classList.remove('overflow-hidden', 'max-h-full');
                zooContainer.classList.add('overflow-y-auto');
            }
        }

        if (target === 'home') {
            viewPuzzle.classList.add('hidden');
            viewZoo.classList.add('hidden');
            viewHome.classList.remove('hidden');
            if (tabBtnHome) tabBtnHome.classList.add('text-emerald-600');
            updateHeaderLogoVisibility('home');
            renderHomeScreen();
            return;
        }

        if (target === 'puzzle') {
            viewHome.classList.add('hidden');
            viewZoo.classList.add('hidden');
            viewPuzzle.classList.remove('hidden');
            if (tabBtnPuzzle) tabBtnPuzzle.classList.add('text-emerald-600');
            updateHeaderLogoVisibility('puzzle');
            if (!ensureCurrentPuzzleLevelLoaded()) {
                renderChecklistHUD();
            }
            return;
        }

        if (!state.zooUnlocked) return;

        viewHome.classList.add('hidden');
        viewPuzzle.classList.add('hidden');
        viewZoo.classList.remove('hidden');
        if (tabBtnZoo) tabBtnZoo.classList.add('text-emerald-600');
        updateHeaderLogoVisibility('zoo');
        renderZooHabitat();
        setZooWelcomeVisibility(!state.zooWelcomeSeen);

        if (!state.zooWelcomeSeen) return;

        if (!state.tutorialComplete && state.tutorialStep === 0) {
            startGuidedTutorial();
        }
    }

    function onNextProgressStep(destination = 'next') {
        stopChestSparkles();
        hideProgressionOverlay({ collectPendingReward: true });

        if (state.chestProgress >= state.chestGoal) {
            triggerChestOpeningSequence(destination);
            return;
        }

        state.currentLevelNumber++;
        saveState();

        if (destination === 'menu' && state.currentLevelNumber >= 9) {
            switchTab('home');
        } else {
            initGrid();
        }
    }

    function triggerChestOpeningSequence(destinationFlow = 'next') {
        playSound('win');
        const modal = document.getElementById('chest-opening-modal');
        const zooBtn = document.getElementById('chest-zoo-btn');
        const nextBtn = document.getElementById('chest-next-btn');
        const rewardSpeciesBox = document.getElementById('chest-reward-species-box');
        if (!modal || !zooBtn || !nextBtn || !rewardSpeciesBox) return;

        modal.classList.remove('hidden');

        const nextLockedAnimal = state.animals.find(animal => !state.unlockedCompanionIds.includes(animal.id));

        if (nextLockedAnimal) {
            state.unlockedCompanionIds.push(nextLockedAnimal.id);
            document.getElementById('chest-reward-species-art').innerHTML = animalHeadMarkup(nextLockedAnimal, 'animal-head--2xl');
            document.getElementById('chest-reward-species-name').innerText = nextLockedAnimal.name;
            document.getElementById('chest-reward-species-label').innerText = "NEW ANIMAL!";
            zooBtn.innerText = "Collect and Visit Zoo";
            nextBtn.innerText = "Collect and Next Level";
            rewardSpeciesBox.classList.remove('hidden');

            checkZooUnlockingProgress();
        } else {
            document.getElementById('chest-reward-species-art').innerHTML = '<img src="../assets/treasure-chest.png" alt="Treasure chest" class="h-24 w-24 object-contain drop-shadow-[0_12px_18px_rgba(120,53,15,0.2)]">';
            document.getElementById('chest-reward-species-name').innerText = "Gold Card";
            document.getElementById('chest-reward-species-label').innerText = "WILDCARD";
            zooBtn.innerText = "Collect and Visit Zoo";
            nextBtn.innerText = "Collect and Next Level";
        }

        const ownedAnimals = state.animals.filter(animal => state.unlockedCompanionIds.includes(animal.id));
        const randomOwned = ownedAnimals[Math.floor(Math.random() * ownedAnimals.length)];
        const shardBonus = 5;
        randomOwned.shardsCollected = getAnimalCollectedShards(randomOwned) + shardBonus;

        document.getElementById('chest-reward-shards-art').innerHTML = animalHeadMarkup(randomOwned, 'animal-head--sm');
        document.getElementById('chest-reward-shards-text').innerText = `+${shardBonus}`;

        state.coins += 100;
        document.getElementById('chest-reward-coins').innerText = `+100`;
        state.chestProgress = 0;
        state.chestGoal++;

        const menuBtn = document.getElementById('chest-menu-btn');
        if (menuBtn) {
            menuBtn.classList.remove('hidden');
        }

        saveState();
        renderZooHabitat();
        updateHUD();
    }

    function checkZooUnlockingProgress() {
        if (state.unlockedCompanionIds.length >= 2 && !state.zooUnlocked) {
            state.zooUnlocked = true;
            syncZooUnlockUI();
            saveState();
        }
    }

    function checkMainHomeScreenUnlocks() {
        syncHomeUnlockUI();
    }

    function onCloseChestAndUnlock(destination = 'next') {
        document.getElementById('chest-opening-modal').classList.add('hidden');

        state.currentLevelNumber++;
        saveState();

        if (destination === 'zoo') {
            switchTab('zoo');
        } else if (destination === 'menu') {
            if (state.currentLevelNumber >= 10) {
                switchTab('home');
            } else {
                switchTab('puzzle');
            }
        } else if (state.zooUnlocked && !state.zooWelcomeSeen) {
            switchTab('zoo');
        } else {
            initGrid();
        }
    }

    function toggleFavoriteMascot(animalId) {
        if (!state.tutorialComplete && state.tutorialStep === 1 && animalId !== favoriteTutorialAnimalId) {
            showFloatAlert(`Tap ${getAnimalName(favoriteTutorialAnimalId)}'s Fav button to continue.`);
            playSound('error');
            return;
        }

        if (!state.tutorialComplete && state.tutorialStep === 2) {
            showFloatAlert(`Level up ${getAnimalName(upgradeTutorialAnimalId)} to continue.`);
            playSound('error');
            return;
        }

        state.favoriteMascot = animalId;
        const completedFavoriteTutorial = !state.tutorialComplete && state.tutorialStep === 1 && animalId === favoriteTutorialAnimalId;
        if (completedFavoriteTutorial) {
            const tutorialUpgradeAnimal = state.animals.find(entry => entry.id === upgradeTutorialAnimalId);
            if (tutorialUpgradeAnimal) {
                const tutorialProgress = getAnimalShardProgress(tutorialUpgradeAnimal);
                tutorialUpgradeAnimal.shardsCollected = Math.max(
                    getAnimalCollectedShards(tutorialUpgradeAnimal),
                    tutorialProgress.nextLevelRequirement
                );
            }
            advanceZooTutorial();
        }

        updateHUD();
        renderZooHabitat();
        renderHomeScreen();
        saveState();
        if (completedFavoriteTutorial) {
            refreshZooTutorial?.();
        }
    }

    function upgradeAnimal(animalId) {
        const animal = state.animals.find(entry => entry.id === animalId);
        if (!animal || !state.unlockedCompanionIds.includes(animalId)) return;

        if (!state.tutorialComplete && state.tutorialStep === 1) {
            showFloatAlert(`Tap ${getAnimalName(favoriteTutorialAnimalId)}'s Fav button to continue.`);
            playSound('error');
            return;
        }

        if (!state.tutorialComplete && state.tutorialStep === 2 && animalId !== upgradeTutorialAnimalId) {
            showFloatAlert(`Level up ${getAnimalName(upgradeTutorialAnimalId)} to continue.`);
            playSound('error');
            return;
        }

        const tutorialFreeUpgrade = !state.tutorialComplete && state.tutorialStep === 2 && animalId === upgradeTutorialAnimalId;
        const shardProgress = getAnimalShardProgress(animal);
        const upgradeCoinCost = getAnimalUpgradeCoinCost(animal);
        if (!tutorialFreeUpgrade && shardProgress.collectedShards < shardProgress.nextLevelRequirement) {
            showFloatAlert(`Need ${shardProgress.remainingShards} more shards`);
            playSound('error');
            return;
        }

        if (!tutorialFreeUpgrade && state.coins < upgradeCoinCost) {
            showFloatAlert(`Need ${upgradeCoinCost - state.coins} more coins`);
            playSound('error');
            return;
        }

        if (!canUpgradeAnimal(animal, state.coins, { tutorialFree: tutorialFreeUpgrade })) {
            playSound('error');
            return;
        }

        if (!tutorialFreeUpgrade) {
            state.coins -= upgradeCoinCost;
        }

        animal.level += 1;

        playSound('levelup');
        const completedTutorialUpgrade = !state.tutorialComplete && state.tutorialStep === 2 && animalId === upgradeTutorialAnimalId;
        if (completedTutorialUpgrade) {
            advanceZooTutorial();
        }

        updateHUD();
        renderZooHabitat();
        renderHomeScreen();
        saveState();
        if (completedTutorialUpgrade) {
            refreshZooTutorial?.();
        }
    }

    return {
        applyLevelSelection,
        applySelectedLevelFromSettings,
        checkMainHomeScreenUnlocks,
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
    };
}
