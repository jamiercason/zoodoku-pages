export function createUiHelpers({
    state,
    favoriteTutorialAnimalId,
    upgradeTutorialAnimalId,
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
    calculateTotalPower,
    playSound
}) {
    let sparkleInterval = null;

    function syncHomeUnlockUI() {
        const homeBtn = document.getElementById('tab-btn-home');
        const homeLockBadge = document.getElementById('home-lock-badge');
        if (!homeBtn || !homeLockBadge) return;

        if (state.currentLevelNumber >= 10) {
            homeBtn.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 group hover:text-emerald-500 cursor-pointer";
            homeBtn.classList.remove('opacity-40', 'pointer-events-none');
            homeLockBadge.classList.add('hidden');
        } else {
            homeBtn.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 opacity-40 pointer-events-none";
            homeLockBadge.classList.remove('hidden');
        }
    }

    function syncZooUnlockUI() {
        const tabBtnZoo = document.getElementById('tab-btn-zoo');
        const mascotBtn = document.getElementById('zoo-mascot-btn');
        const zooPowerHud = document.getElementById('zoo-power-hud');
        const zooLabel = document.getElementById('tab-label-zoo');
        const zooUpgradeBadge = document.getElementById('zoo-upgrade-badge');

        if (!tabBtnZoo || !mascotBtn || !zooPowerHud || !zooLabel || !zooUpgradeBadge) return;

        const upgradeCount = getAvailableZooUpgradeCount();

        if (state.zooUnlocked) {
            tabBtnZoo.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 group hover:text-emerald-500 cursor-pointer";
            zooLabel.innerHTML = "My Zoo";

            mascotBtn.className = "w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shadow-md border-2 border-yellow-300 hover:scale-105 active:scale-95 transition-transform";
            mascotBtn.classList.remove('opacity-50', 'pointer-events-none');

            zooPowerHud.classList.remove('opacity-50');

            zooUpgradeBadge.classList.toggle('hidden', upgradeCount === 0);
            zooUpgradeBadge.classList.toggle('zoo-upgrade-growl', upgradeCount > 0);
            zooUpgradeBadge.innerText = String(upgradeCount);
        } else {
            tabBtnZoo.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 opacity-40 pointer-events-none cursor-not-allowed";
            zooLabel.innerHTML = "My Zoo <span class=\"ml-1 text-[9px]\">🔒</span>";

            mascotBtn.className = "w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shadow-md border-2 border-slate-300 pointer-events-none opacity-50";
            zooPowerHud.classList.add('opacity-50');
            zooUpgradeBadge.classList.add('hidden');
            zooUpgradeBadge.classList.remove('zoo-upgrade-growl');
        }
    }

    function updateHeaderLogoVisibility(activeTab) {
        const headerLogo = document.getElementById('hud-header-logo');
        if (!headerLogo) return;
        headerLogo.classList.toggle('hidden', activeTab === 'home');
    }

    function renderHomeZooPreview() {
        const roamerLayer = document.getElementById('home-habitat-roamers');
        if (!roamerLayer) return;

        roamerLayer.innerHTML = '';
        const unlockedAnimals = state.animals.filter(animal => state.unlockedCompanionIds.includes(animal.id));

        unlockedAnimals.slice(0, 5).forEach((animal, index) => {
            const roamer = document.createElement('div');
            roamer.className = `absolute home-roamer roamer-${index % 4}`;
            roamer.style.left = `${16 + (index * 46)}px`;
            roamer.style.top = `${18 + ((index + 1) % 2) * 24}px`;
            roamer.innerHTML = animalHeadMarkup(animal, 'animal-head--sm');
            roamerLayer.appendChild(roamer);
        });
    }

    function renderHomeScreen() {
        const activeLevelData = getActiveLevelData();
        const statusLevel = document.getElementById('home-status-level');
        const chestText = document.getElementById('home-chest-progress-txt');
        const chestBar = document.getElementById('home-chest-progress-bar');

        if (statusLevel && activeLevelData.location) {
            const levelIcons = [
                getDifficultyIcon(activeLevelData.difficulty),
                getLevelLocationIcon(activeLevelData.location),
                getTimeIcon(activeLevelData.time),
                getTempIcon(activeLevelData.temp)
            ].join(' ');
            statusLevel.innerHTML = `Next level - ${state.currentLevelNumber} ${levelIcons}`;
        }
        if (chestText) chestText.innerText = `${state.chestProgress} / ${state.chestGoal} Levels`;
        if (chestBar) chestBar.style.width = `${(state.chestProgress / state.chestGoal) * 100}%`;

        renderHomeZooPreview();
    }

    function setZooWelcomeVisibility(showWelcome) {
        const welcomePanel = document.getElementById('zoo-welcome-panel');
        const welcomeScrim = document.getElementById('zoo-welcome-scrim');
        const habitatContent = document.getElementById('zoo-habitat-content');
        if (!welcomePanel || !habitatContent) return;

        welcomePanel.classList.toggle('hidden', !showWelcome);
        if (welcomeScrim) welcomeScrim.classList.toggle('hidden', !showWelcome);
        habitatContent.classList.remove('hidden');
    }

    function renderChecklistHUD() {
        const activeLevelData = getActiveLevelData();
        const container = document.getElementById('hunt-target-checklist');
        if (!container) return;

        container.innerHTML = '';

        const targets = {};
        for (let zoneId = 0; zoneId < activeLevelData.gridSize; zoneId++) {
            const animalId = state.levelZoneAssignments[zoneId];
            targets[animalId] = (targets[animalId] || 0) + 1;
        }

        const currentCounts = {};
        for (let r = 0; r < activeLevelData.gridSize; r++) {
            for (let c = 0; c < activeLevelData.gridSize; c++) {
                if (state.gridState[r][c] !== 2) continue;
                const zoneId = activeLevelData.colorMap[r][c];
                const animalId = state.levelZoneAssignments[zoneId];
                currentCounts[animalId] = (currentCounts[animalId] || 0) + 1;
            }
        }

        Object.keys(targets).sort().forEach(animalId => {
            const animal = state.animals.find(entry => entry.id === animalId);
            if (!animal) return;

            const targetCount = targets[animalId];
            const activeCount = currentCounts[animalId] || 0;
            const isComplete = activeCount === targetCount;

            const tab = document.createElement('div');
            tab.className = `flex items-center space-x-1 px-3 py-1.5 rounded-b-2xl rounded-t-xl border border-t-0 font-bold transition-all shadow-sm text-xs ${isComplete ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-emerald-100 text-slate-700'}`;
            tab.innerHTML = `
                ${animalHeadMarkup(animal, 'animal-head--tiny')}
                <span>${activeCount}/${targetCount}</span>
            `;
            container.appendChild(tab);
        });
    }

    function updateCellVisual(r, c) {
        const activeLevelData = getActiveLevelData();
        const val = state.gridState[r][c];
        const cell = document.getElementById(`cell-${r}-${c}`);
        if (!cell) return;

        cell.innerHTML = '';

        if (val === 1) {
            cell.innerHTML = xMarkerMarkup(getMarkerInkColor(getCellBackgroundColor(r, c)));
        } else if (val === 2) {
            const zoneId = activeLevelData.colorMap[r][c];
            const animalId = state.levelZoneAssignments[zoneId];
            const animal = state.animals.find(entry => entry.id === animalId);
            cell.innerHTML = animalHeadMarkup(animal, 'animal-head--lg', 'animate-bounce-short');
        } else if (val === 3) {
            cell.innerHTML = xMarkerMarkup('#dc2626', 'x-marker--error');
        }
    }

    function xMarkerMarkup(color, extraClass = '') {
        const classes = ['x-marker', extraClass].filter(Boolean).join(' ');
        const style = `--x-marker-color:${color};`;
        return `
            <span class="${classes}" style="${style}" aria-hidden="true">
                <span class="x-marker__stroke x-marker__stroke--a"></span>
                <span class="x-marker__stroke x-marker__stroke--b"></span>
            </span>
        `;
    }

    function updateHeartsUI() {
        const container = document.getElementById('heart-container');
        if (!container) return;

        let heartsHtml = '';
        for (let i = 0; i < 3; i++) {
            heartsHtml += i < state.hearts ? '❤️' : '🖤';
        }
        container.innerHTML = heartsHtml;
    }

    function updateProgressText() {
        const activeLevelData = getActiveLevelData();
        const animalTotal = document.getElementById('animal-total');
        if (animalTotal && activeLevelData.gridSize) {
            animalTotal.innerText = String(activeLevelData.gridSize);
        }
    }

    function renderProgressionAnimalStage(solvedAnimals) {
        const stage = document.getElementById('progression-animal-stage');
        const coinValue = document.getElementById('progression-coin-value');
        if (!stage) return;

        stage.innerHTML = '';
        if (coinValue) coinValue.innerText = '50';

        solvedAnimals.slice(0, 3).forEach((entry, index) => {
            const dancer = document.createElement('div');
            dancer.className = `level-win-animal ${index === 0 ? 'level-win-animal--lead' : ''}`;
            dancer.style.setProperty('--win-delay', `${index * 0.08}s`);
            const sizeClass = index === 0 ? 'animal-head--2xl' : 'animal-head--xl';
            dancer.innerHTML = `
                <div class="level-win-animal__head">
                    ${animalHeadMarkup(entry.animal, sizeClass)}
                    ${entry.count > 1 ? `<span class="level-win-animal__badge">${entry.count}</span>` : ''}
                </div>
            `;
            stage.appendChild(dancer);
        });
    }

    function hideProgressionOverlay() {
        const modal = document.getElementById('progression-modal');
        const mask = document.getElementById('progression-mask');
        const banner = document.getElementById('progression-banner');
        const card = document.getElementById('progression-card');
        if (!modal || !card || !banner || !mask) return;

        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0', 'pointer-events-none');
        mask.classList.remove('level-win-mask--show');
        banner.classList.remove('level-win-banner--show');
        card.classList.remove('level-win-card--show');
        card.style.opacity = '';
        card.style.transform = '';
        setTimeout(() => {
            if (!modal.classList.contains('opacity-100')) {
                modal.classList.add('hidden');
            }
        }, 220);
    }

    function showProgressionOverlay(solvedAnimals = []) {
        const modal = document.getElementById('progression-modal');
        const mask = document.getElementById('progression-mask');
        const banner = document.getElementById('progression-banner');
        const card = document.getElementById('progression-card');
        const title = document.getElementById('progression-title');
        const kicker = document.getElementById('progression-kicker');
        const ctaBtn = document.getElementById('progression-cta-btn');
        const menuBtn = document.getElementById('progression-menu-btn');
        if (!modal || !mask || !banner || !card || !title || !kicker || !ctaBtn || !menuBtn) return;

        const chestReady = state.chestProgress >= state.chestGoal;
        const displayedChestProgress = Math.min(state.chestProgress, state.chestGoal);

        modal.classList.remove('hidden');
        modal.classList.remove('pointer-events-none', 'opacity-0');
        modal.classList.add('opacity-100');
        mask.classList.remove('level-win-mask--show');
        banner.classList.remove('level-win-banner--show');
        card.classList.remove('level-win-card--show');

        renderProgressionAnimalStage(solvedAnimals);

        const bar = document.getElementById('progression-bar');
        const progressText = document.getElementById('progression-text');
        const pct = Math.min((displayedChestProgress / state.chestGoal) * 100, 100);

        if (bar) {
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = `${pct}%`;
            }, 100);
        }

        if (progressText) {
            progressText.innerText = chestReady
                ? `Chest ready • ${state.chestGoal} / ${state.chestGoal}`
                : `${displayedChestProgress} / ${state.chestGoal} Levels Completed`;
        }

        kicker.innerText = 'You Won';
        title.innerText = 'Challenge Cleared!';
        ctaBtn.innerText = chestReady ? 'Open' : 'Next Level';

        if (state.currentLevelNumber >= 9) {
            menuBtn.classList.remove('hidden');
        } else {
            menuBtn.classList.add('hidden');
        }

        startChestSparkles();
        requestAnimationFrame(() => {
            banner.classList.add('level-win-banner--show');
            setTimeout(() => {
                mask.classList.add('level-win-mask--show');
                card.classList.add('level-win-card--show');
            }, 700);
        });
    }

    function startChestSparkles() {
        const layer = document.getElementById('sparkle-layer');
        if (!layer) return;

        layer.innerHTML = '';

        if (sparkleInterval) clearInterval(sparkleInterval);

        sparkleInterval = setInterval(() => {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle-particle text-amber-400 select-none pointer-events-none text-base';
            sparkle.innerText = Math.random() > 0.5 ? '✨' : '⭐';

            const xVal = (Math.random() * 60 - 30) + 'px';
            const yVal = -(Math.random() * 40 + 10) + 'px';
            sparkle.style.setProperty('--tw-x', xVal);
            sparkle.style.setProperty('--tw-y', yVal);
            sparkle.style.left = '50%';
            sparkle.style.top = '50%';

            layer.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1200);
        }, 450);
    }

    function stopChestSparkles() {
        if (sparkleInterval) {
            clearInterval(sparkleInterval);
            sparkleInterval = null;
        }
    }

    function populateSettingsLevelControls() {
        const input = document.getElementById('settings-level-input');
        const summary = document.getElementById('settings-level-summary');
        if (input) input.value = String(state.currentLevelNumber);
        if (summary) {
            summary.innerText = `Current: Level ${state.currentLevelNumber} • Chest ${state.chestProgress}/${state.chestGoal} • Zoo ${state.zooUnlocked ? 'Unlocked' : 'Locked'}`;
        }
    }

    function toggleHowToPlay(show) {
        playSound('tap');
        const modal = document.getElementById('how-to-play-modal');
        if (!modal) return;
        modal.classList.toggle('hidden', !show);
    }

    function toggleSettingsMenu(show) {
        playSound('tap');
        const modal = document.getElementById('settings-modal');
        if (!modal) return;
        if (show) {
            populateSettingsLevelControls();
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    function showTooltip(title, text, sourceEl) {
        playSound('tap');
        const balloon = document.getElementById('tooltip-balloon');
        const anchorEl = sourceEl || event.currentTarget;
        if (!balloon || !anchorEl) return;

        const rect = anchorEl.getBoundingClientRect();

        document.getElementById('tooltip-title').innerText = title;
        document.getElementById('tooltip-desc').innerText = text;

        balloon.style.left = `${rect.left + window.scrollX - 50}px`;
        balloon.style.top = `${rect.bottom + window.scrollY + 8}px`;
        balloon.style.opacity = '1';

        setTimeout(() => {
            balloon.style.opacity = '0';
        }, 3000);
    }

    function updatePowerUpCostsBadge() {
        const currentRevealCost = 50 * Math.pow(2, getLevelRevealUses());
        const currentHintCost = 30 * Math.pow(2, getLevelHintUses());

        document.getElementById('reveal-cost-badge').innerHTML = `<span class="coin-inline"><span>${currentRevealCost}</span><span class="coin-icon coin-icon--sm" aria-hidden="true"></span></span>`;
        document.getElementById('hint-cost-badge').innerHTML = `<span class="coin-inline"><span>${currentHintCost}</span><span class="coin-icon coin-icon--sm" aria-hidden="true"></span></span>`;
    }

    function updateHUD() {
        const activeLevelData = getActiveLevelData();
        const coinCounter = document.getElementById('coin-counter');
        const powerCounter = document.getElementById('power-counter');
        const mascot = document.getElementById('hud-mascot');
        const levelNumber = document.getElementById('level-number');
        const levelDifficultyLabel = document.getElementById('level-difficulty-label');
        const locationIcon = document.getElementById('level-location-icon');
        const difficultyIcon = document.getElementById('level-difficulty-icon');
        const timeIcon = document.getElementById('level-time-icon');
        const tempIcon = document.getElementById('level-temp-icon');
        const animalTotal = document.getElementById('animal-total');

        if (coinCounter) coinCounter.innerText = String(state.coins);
        if (powerCounter) {
            powerCounter.innerText = String(calculateTotalPower(state.animals, state.unlockedCompanionIds));
        }
        if (mascot) mascot.innerHTML = getMascotArt();

        if (levelNumber && activeLevelData.gridSize) {
            levelNumber.innerText = `Level ${state.currentLevelNumber}`;
        }
        if (locationIcon && activeLevelData.location) {
            locationIcon.innerHTML = getLevelLocationIcon(activeLevelData.location);
        }
        if (difficultyIcon && activeLevelData.difficulty) {
            difficultyIcon.innerText = getDifficultyIcon(activeLevelData.difficulty);
        }
        if (levelDifficultyLabel && activeLevelData.difficulty) {
            levelDifficultyLabel.innerText = activeLevelData.difficulty;
        }
        if (timeIcon && activeLevelData.time) {
            timeIcon.innerText = getTimeIcon(activeLevelData.time);
        }
        if (tempIcon && activeLevelData.temp) {
            tempIcon.innerText = getTempIcon(activeLevelData.temp);
        }
        if (animalTotal && activeLevelData.gridSize) {
            animalTotal.innerText = String(activeLevelData.gridSize);
        }
    }

    function showFloatAlert(message) {
        const gameView = document.getElementById('game-view');
        if (!gameView) return;

        const alert = document.createElement('div');
        alert.className = 'float-alert';
        alert.innerText = message;
        gameView.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 1800);
    }

    function triggerConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;

        container.innerHTML = '';

        const pieceCount = 88;
        const colors = ['#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#f87171', '#facc15'];
        const paperVariants = ['confetti--sliver', 'confetti--ticket', 'confetti--diamond'];

        for (let i = 0; i < pieceCount; i++) {
            const bit = document.createElement('span');
            const isGlitter = Math.random() < 0.24;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const paperVariant = paperVariants[Math.floor(Math.random() * paperVariants.length)];
            const pieceWidth = isGlitter ? 3 + Math.random() * 3 : 5 + Math.random() * 6;
            const pieceHeight = isGlitter ? pieceWidth : 10 + Math.random() * 12;
            const riseX = -175 + Math.random() * 350;
            const riseY = -360 - Math.random() * 250;
            const hoverX = riseX + (-12 + Math.random() * 24);
            const hoverY = riseY + (8 + Math.random() * 18);
            const dropStartX = hoverX + (-20 + Math.random() * 40);
            const dropStartY = hoverY + (24 + Math.random() * 44);
            const fallX = dropStartX + (-36 + Math.random() * 72);
            const fallY = dropStartY + (42 + Math.random() * 80);
            const startRotation = -80 + Math.random() * 160;
            const apexRotation = startRotation + (-160 + Math.random() * 320);
            const dropRotation = apexRotation + (-50 + Math.random() * 100);
            const endRotation = apexRotation + 240 + Math.random() * 520;

            bit.className = `confetti ${isGlitter ? 'confetti--glitter' : `confetti--paper ${paperVariant}`}`;
            bit.style.left = `${Math.random() * 100}%`;
            bit.style.bottom = `${-10 - Math.random() * 18}px`;
            bit.style.width = `${pieceWidth}px`;
            bit.style.height = `${pieceHeight}px`;
            bit.style.animationDuration = `${2.8 + Math.random() * 1.15}s`;
            bit.style.animationDelay = `${Math.random() * 0.18}s`;
            bit.style.setProperty('--confetti-color', color);
            bit.style.setProperty('--confetti-rise-x', `${riseX}px`);
            bit.style.setProperty('--confetti-rise-y', `${riseY}px`);
            bit.style.setProperty('--confetti-hover-x', `${hoverX}px`);
            bit.style.setProperty('--confetti-hover-y', `${hoverY}px`);
            bit.style.setProperty('--confetti-drop-start-x', `${dropStartX}px`);
            bit.style.setProperty('--confetti-drop-start-y', `${dropStartY}px`);
            bit.style.setProperty('--confetti-fall-x', `${fallX}px`);
            bit.style.setProperty('--confetti-fall-y', `${fallY}px`);
            bit.style.setProperty('--confetti-rotate-start', `${startRotation}deg`);
            bit.style.setProperty('--confetti-rotate-apex', `${apexRotation}deg`);
            bit.style.setProperty('--confetti-rotate-drop', `${dropRotation}deg`);
            bit.style.setProperty('--confetti-rotate-end', `${endRotation}deg`);
            bit.style.setProperty('--confetti-scale-start', `${0.65 + Math.random() * 0.35}`);
            bit.style.setProperty('--confetti-scale-apex', `${0.95 + Math.random() * 0.45}`);
            bit.style.setProperty('--confetti-scale-drop', `${0.9 + Math.random() * 0.3}`);
            bit.style.setProperty('--confetti-scale-end', `${0.75 + Math.random() * 0.35}`);
            bit.style.setProperty('--confetti-twinkle-duration', `${0.35 + Math.random() * 0.45}s`);
            bit.style.setProperty('--confetti-flutter-duration', `${0.85 + Math.random() * 0.7}s`);
            bit.style.setProperty('--confetti-flip-start', `${-55 + Math.random() * 110}deg`);
            bit.style.setProperty('--confetti-flip-mid', `${160 + Math.random() * 220}deg`);
            bit.style.setProperty('--confetti-flip-end', `${420 + Math.random() * 260}deg`);
            bit.innerHTML = '<span class="confetti__shape"></span>';
            bit.addEventListener('animationend', () => {
                bit.remove();
            }, { once: true });
            container.appendChild(bit);
        }
    }

    function renderZooHabitat() {
        const roamerLayer = document.getElementById('habitat-roamers');
        const cardGrid = document.getElementById('animal-card-grid');
        if (!roamerLayer || !cardGrid) return;

        roamerLayer.innerHTML = '';
        cardGrid.innerHTML = '';

        const unlockedAnimals = state.animals.filter(animal => state.unlockedCompanionIds.includes(animal.id));

        unlockedAnimals.forEach((animal, index) => {
            const roamer = document.createElement('div');
            roamer.className = `absolute roamer-${index % 4}`;
            roamer.style.left = `${10 + (index * 18)}px`;
            roamer.style.top = `${12 + ((index % 3) * 24)}px`;
            roamer.innerHTML = animalHeadMarkup(animal, 'animal-head--md');
            roamerLayer.appendChild(roamer);
        });

        state.animals.forEach(animal => {
            const isUnlocked = state.unlockedCompanionIds.includes(animal.id);
            const isFavorite = state.favoriteMascot === animal.id;

            const card = document.createElement('div');
            card.id = `animal-card-${animal.id}`;
            card.className = `relative rounded-2xl border p-3 shadow-sm ${isUnlocked ? 'bg-white border-emerald-100' : 'bg-slate-100 border-slate-200 opacity-75'}`;

            const favoriteHand = animal.id === favoriteTutorialAnimalId
                ? '<div id="hand-favorite-tutorial" class="onboarding-hand hidden absolute -top-5 left-1/2 -translate-x-1/2 text-xl pointing-finger">👇</div>'
                : '';
            const upgradeHand = animal.id === upgradeTutorialAnimalId
                ? '<div id="hand-upgrade-tutorial" class="onboarding-hand hidden absolute -bottom-4 right-3 text-xl pointing-finger">👆</div>'
                : '';

            if (isUnlocked) {
                const upgradeLabel = !state.tutorialComplete && state.tutorialStep === 2 && animal.id === upgradeTutorialAnimalId
                    ? 'FREE'
                    : `${animal.shards}/${animal.requiredShards}`;

                card.innerHTML = `
                    ${animal.id === upgradeTutorialAnimalId ? upgradeHand : ''}
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            ${animalHeadMarkup(animal, 'animal-head--lg', 'animal-head--card')}
                            <h4 class="mt-1 font-black text-slate-800">${animal.name}</h4>
                            <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Level ${animal.level}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold uppercase tracking-wide ${isFavorite ? 'text-amber-500' : 'text-slate-400'}">${isFavorite ? 'Favorite' : 'Companion'}</div>
                            <div class="text-xs font-bold text-emerald-600">${animal.level * animal.powerMultiplier} power</div>
                        </div>
                    </div>
                    <div class="mt-3 space-y-2">
                        <div class="text-[10px] text-slate-500">Shards: <span class="font-bold text-slate-700">${animal.shards}</span></div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="relative">
                                ${animal.id === favoriteTutorialAnimalId ? favoriteHand : ''}
                                <button data-action="favorite-mascot" data-animal-id="${animal.id}" class="w-full rounded-xl px-2 py-2 text-[10px] font-bold ${isFavorite ? 'bg-amber-400 text-slate-900' : 'bg-amber-50 text-amber-700 border border-amber-200'}">🌟 Fav</button>
                            </div>
                            <button data-action="upgrade-animal" data-animal-id="${animal.id}" class="rounded-xl px-2 py-2 text-[10px] font-bold bg-emerald-500 text-white">🔼 ${upgradeLabel}</button>
                        </div>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    ${animalHeadMarkup(animal, 'animal-head--lg', 'animal-head--card grayscale')}
                    <h4 class="mt-1 font-black text-slate-700">${animal.name}</h4>
                    <p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">Locked</p>
                    <div class="mt-3 text-[10px] text-slate-500">Unlock via chest progression</div>
                    <div class="mt-1 text-xs font-bold text-slate-600">${animal.cost} coins reference</div>
                `;
            }

            cardGrid.appendChild(card);
        });

        syncZooUnlockUI();
    }

    return {
        hideProgressionOverlay,
        populateSettingsLevelControls,
        renderChecklistHUD,
        renderHomeScreen,
        renderProgressionAnimalStage,
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
    };
}
