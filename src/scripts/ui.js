export function createUiHelpers({
    state,
    favoriteTutorialAnimalId,
    upgradeTutorialAnimalId,
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
    zooIdleCapHours,
    calculateTotalPower,
    playSound
}) {
    let sparkleInterval = null;
    let isZooEarningsCollecting = false;
    let progressionRewardTimeout = null;
    let pendingProgressionReward = null;
    const habitatRoamerSignatures = new Map();

    function syncHomeUnlockUI() {
        const homeBtn = document.getElementById('tab-btn-home');
        const homeLockBadge = document.getElementById('home-lock-badge');
        if (!homeBtn || !homeLockBadge) return;

        if (state.currentLevelNumber >= 10) {
            homeBtn.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 group hover:text-emerald-500 cursor-pointer";
            homeBtn.classList.remove('opacity-40', 'pointer-events-none');
            homeLockBadge.classList.add('hidden');
        } else {
            homeBtn.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 group opacity-40 pointer-events-none";
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
            zooLabel.innerHTML = "MY ZOO";

            mascotBtn.className = "w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shadow-md border-2 border-yellow-300 hover:scale-105 active:scale-95 transition-transform";
            mascotBtn.classList.remove('opacity-50', 'pointer-events-none');

            zooPowerHud.classList.remove('opacity-50');

            zooUpgradeBadge.classList.toggle('hidden', upgradeCount === 0);
            zooUpgradeBadge.classList.toggle('zoo-upgrade-growl', upgradeCount > 0);
            zooUpgradeBadge.innerText = String(upgradeCount);
        } else {
            tabBtnZoo.className = "flex flex-col items-center space-y-1 text-slate-400 transition duration-200 group opacity-40 pointer-events-none cursor-not-allowed";
            zooLabel.innerHTML = "MY ZOO <span class=\"ml-1 nav-tab-lock\">🔒</span>";

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

    function getZooPowerTotal() {
        return calculateTotalPower(state.animals, state.unlockedCompanionIds);
    }

    function getSafeZooEarningsTimestamp(now = Date.now()) {
        const numericTimestamp = Number(state.zooEarningsLastCollectedAt);
        const hasZooProgress = state.zooUnlocked || state.unlockedCompanionIds.length > 1;
        const fallbackTimestamp = hasZooProgress
            ? now - (3 * 60 * 1000)
            : now;

        if (!Number.isFinite(numericTimestamp) || numericTimestamp > now) {
            state.zooEarningsLastCollectedAt = fallbackTimestamp;
            return fallbackTimestamp;
        }

        return numericTimestamp;
    }

    function getCurrentZooEarnings(now = Date.now()) {
        return calculateZooIdleCoins({
            lastCollectedAt: getSafeZooEarningsTimestamp(now),
            now,
            zooPower: getZooPowerTotal()
        });
    }

    function getHabitatRoamerPosition(index) {
        return {
            left: 10 + (index * 18),
            top: 12 + ((index % 3) * 24)
        };
    }

    function habitatRoamerMarkup(animal) {
        const isFavorite = state.favoriteMascot === animal.id;
        const favoriteBadge = isFavorite
            ? '<span class="favorite-growl-badge zoo-roamer__favorite" aria-label="Favorite animal">⭐</span>'
            : '';

        return `
            <span class="zoo-roamer__sprite">
                ${favoriteBadge}
                ${animalHeadMarkup(animal, 'animal-head--md')}
            </span>
            <span class="zoo-roamer__level" aria-label="${animal.name} level ${animal.level}">${animal.level}</span>
        `;
    }

    function getHabitatRoamerSignature() {
        return state.animals
            .filter(animal => state.unlockedCompanionIds.includes(animal.id))
            .map(animal => `${animal.id}:${animal.level}:${state.favoriteMascot === animal.id ? 'fav' : 'plain'}`)
            .join('|');
    }

    function renderHabitatRoamers(layerId) {
        const roamerLayer = document.getElementById(layerId);
        if (!roamerLayer) return;

        const unlockedAnimals = state.animals.filter(animal => state.unlockedCompanionIds.includes(animal.id));
        const nextSignature = getHabitatRoamerSignature();

        if (habitatRoamerSignatures.get(layerId) === nextSignature) {
            return;
        }

        habitatRoamerSignatures.set(layerId, nextSignature);
        roamerLayer.innerHTML = '';

        unlockedAnimals.forEach((animal, index) => {
            const roamer = document.createElement('div');
            const anchor = getHabitatRoamerPosition(index);
            roamer.className = `absolute zoo-roamer zoo-roamer--${index % 4}`;
            roamer.style.left = `${anchor.left}px`;
            roamer.style.top = `${anchor.top}px`;
            roamer.innerHTML = habitatRoamerMarkup(animal);
            roamerLayer.appendChild(roamer);
        });
    }

    function renderHomeZooPreview() {
        renderHabitatRoamers('home-habitat-roamers');
    }

    function renderZooEarningsCard() {
        const card = document.getElementById('zoo-earnings-card');
        const amount = document.getElementById('zoo-earnings-amount');
        const chest = document.getElementById('zoo-earnings-chest');
        if (!card || !amount || !chest) return;

        const zooPower = getZooPowerTotal();
        const coinsReady = getCurrentZooEarnings();
        const ratePerMinute = getZooIdleRatePerMinute(zooPower);
        const isReady = coinsReady > 0;

        amount.innerHTML = `<span class="coin-icon coin-icon--sm" aria-hidden="true"></span><span>${coinsReady}</span>`;
        card.title = `Zoo power ${zooPower} • +${ratePerMinute}/min • caps after ${zooIdleCapHours}h`;
        card.setAttribute(
            'aria-label',
            isReady
                ? `Zoo Earnings, ${coinsReady} coins ready to collect`
                : `Zoo Earnings, building at power ${zooPower} and ${ratePerMinute} coins per minute`
        );

        card.disabled = !isReady || isZooEarningsCollecting;
        card.classList.toggle('zoo-earnings-card--ready', isReady);
        card.classList.toggle('zoo-earnings-card--empty', !isReady);
        card.classList.toggle('zoo-earnings-card--collecting', isZooEarningsCollecting);
        chest.classList.toggle('jiggle-chest', isReady && !isZooEarningsCollecting);
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
        if (chestBar) chestBar.style.width = `${Math.min((state.chestProgress / state.chestGoal) * 100, 100)}%`;

        renderHomeZooPreview();
        renderZooEarningsCard();
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

        const { currentCounts, targets, currentTotal, targetTotal } = getPuzzleAnimalCounts();

        const totalChip = document.createElement('div');
        totalChip.className = 'checklist-chip checklist-chip--total';
        totalChip.innerHTML = `
            <span id="animal-total" class="checklist-chip__value">${currentTotal}/${targetTotal}</span>
        `;
        container.appendChild(totalChip);

        Object.keys(targets).sort().forEach(animalId => {
            const animal = state.animals.find(entry => entry.id === animalId);
            if (!animal) return;

            const targetCount = targets[animalId];
            const activeCount = currentCounts[animalId] || 0;
            const isComplete = activeCount === targetCount;

            const tab = document.createElement('div');
            tab.className = `checklist-chip ${isComplete ? 'checklist-chip--complete' : 'checklist-chip--pending'}`;
            tab.innerHTML = `
                ${animalHeadMarkup(animal, 'animal-head--tiny')}
                <span class="checklist-chip__value">${activeCount}/${targetCount}</span>
            `;
            container.appendChild(tab);
        });
    }

    function getPuzzleAnimalCounts() {
        const activeLevelData = getActiveLevelData();
        const targets = {};
        const currentCounts = {};

        if (!activeLevelData.gridSize) {
            return {
                targets,
                currentCounts,
                currentTotal: 0,
                targetTotal: 0
            };
        }

        for (let zoneId = 0; zoneId < activeLevelData.gridSize; zoneId++) {
            const animalId = state.levelZoneAssignments[zoneId];
            targets[animalId] = (targets[animalId] || 0) + 1;
        }

        let currentTotal = 0;
        for (let r = 0; r < activeLevelData.gridSize; r++) {
            for (let c = 0; c < activeLevelData.gridSize; c++) {
                if (state.gridState[r][c] !== 2) continue;
                currentTotal += 1;
                const zoneId = activeLevelData.colorMap[r][c];
                const animalId = state.levelZoneAssignments[zoneId];
                currentCounts[animalId] = (currentCounts[animalId] || 0) + 1;
            }
        }

        return {
            targets,
            currentCounts,
            currentTotal,
            targetTotal: Object.values(targets).reduce((sum, count) => sum + count, 0)
        };
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
        const animalTotal = document.getElementById('animal-total');
        if (animalTotal) {
            const { currentTotal, targetTotal } = getPuzzleAnimalCounts();
            animalTotal.innerText = `${currentTotal}/${targetTotal}`;
        }

        syncZooUnlockUI();
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
            const sizeClass = 'animal-head--xl';
            const isFavorite = entry.animal?.id === state.favoriteMascot;
            dancer.innerHTML = `
                <div class="level-win-animal__head">
                    ${isFavorite ? '<div class="favorite-growl-badge level-win-animal__favorite" aria-label="Favorite animal">⭐</div>' : ''}
                    ${animalHeadMarkup(entry.animal, sizeClass)}
                    ${entry.count > 1 ? `<span class="level-win-animal__badge">${entry.count}</span>` : ''}
                </div>
            `;
            stage.appendChild(dancer);
        });
    }

    function setProgressionOverlayButtonsEnabled(enabled) {
        const ctaBtn = document.getElementById('progression-cta-btn');
        const menuBtn = document.getElementById('progression-menu-btn');

        [ctaBtn, menuBtn].forEach(button => {
            if (!button) return;
            button.disabled = !enabled;
            button.classList.toggle('pointer-events-none', !enabled);
            button.classList.toggle('opacity-60', !enabled);
        });
    }

    function settlePendingProgressionReward({ animate = true } = {}) {
        if (!pendingProgressionReward) return;

        const { coinReward, onRewardCollected } = pendingProgressionReward;
        pendingProgressionReward = null;

        if (progressionRewardTimeout) {
            window.clearTimeout(progressionRewardTimeout);
            progressionRewardTimeout = null;
        }

        if (coinReward <= 0) {
            if (typeof onRewardCollected === 'function') {
                onRewardCollected(coinReward);
            }
            return;
        }

        if (!animate) {
            state.coins += coinReward;
            updateCoinCounterValue(state.coins);
            if (typeof onRewardCollected === 'function') {
                onRewardCollected(coinReward);
            }
            pulseCoinCounter();
            return;
        }

        const startingCoins = state.coins;
        let animatedCoins = 0;

        animateCoinsToHud(coinReward, {
            sourceEl: document.getElementById('progression-coin-burst'),
            onCoinLand(chunkAmount) {
                animatedCoins += chunkAmount;
                state.coins = startingCoins + animatedCoins;
                updateCoinCounterValue(state.coins);
            }
        }).then(() => {
            state.coins = startingCoins + coinReward;
            updateCoinCounterValue(state.coins);
            if (typeof onRewardCollected === 'function') {
                onRewardCollected(coinReward);
            }
            pulseCoinCounter();
        });
    }

    function hideProgressionOverlay(options = {}) {
        const { collectPendingReward = false } = options;
        const modal = document.getElementById('progression-modal');
        const mask = document.getElementById('progression-mask');
        const banner = document.getElementById('progression-banner');
        const card = document.getElementById('progression-card');
        if (!modal || !card || !banner || !mask) return;

        if (collectPendingReward) {
            settlePendingProgressionReward({ animate: false });
        }

        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0', 'pointer-events-none');
        mask.classList.remove('level-win-mask--show');
        banner.classList.remove('level-win-banner--show');
        card.classList.remove('level-win-card--show');
        if (progressionRewardTimeout) {
            window.clearTimeout(progressionRewardTimeout);
            progressionRewardTimeout = null;
        }
        setProgressionOverlayButtonsEnabled(true);
        card.style.opacity = '';
        card.style.transform = '';
        setTimeout(() => {
            if (!modal.classList.contains('opacity-100')) {
                modal.classList.add('hidden');
            }
        }, 220);
    }

    function updateCoinCounterValue(value) {
        const coinCounter = document.getElementById('coin-counter');
        if (coinCounter) {
            coinCounter.innerText = String(value);
        }
    }

    function splitCoinGain(totalAmount, pieceCount) {
        const safePieces = Math.max(1, Math.min(pieceCount, totalAmount));
        const baseAmount = Math.floor(totalAmount / safePieces);
        const remainder = totalAmount % safePieces;
        const chunks = [];

        for (let index = 0; index < safePieces; index++) {
            chunks.push(baseAmount + (index < remainder ? 1 : 0));
        }

        return chunks;
    }

    function showProgressionOverlay(solvedAnimals = [], options = {}) {
        const modal = document.getElementById('progression-modal');
        const mask = document.getElementById('progression-mask');
        const banner = document.getElementById('progression-banner');
        const card = document.getElementById('progression-card');
        const title = document.getElementById('progression-title');
        const kicker = document.getElementById('progression-kicker');
        const ctaBtn = document.getElementById('progression-cta-btn');
        const menuBtn = document.getElementById('progression-menu-btn');
        if (!modal || !mask || !banner || !card || !title || !kicker || !ctaBtn || !menuBtn) return;
        const { coinReward = 50, autoCollectReward = false, onRewardCollected = null } = options;

        const chestReady = state.chestProgress >= state.chestGoal;
        const displayedChestProgress = Math.min(state.chestProgress, state.chestGoal);

        modal.classList.remove('hidden');
        modal.classList.remove('pointer-events-none', 'opacity-0');
        modal.classList.add('opacity-100');
        mask.classList.remove('level-win-mask--show');
        banner.classList.remove('level-win-banner--show');
        card.classList.remove('level-win-card--show');
        if (progressionRewardTimeout) {
            window.clearTimeout(progressionRewardTimeout);
            progressionRewardTimeout = null;
        }
        setProgressionOverlayButtonsEnabled(true);

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

        if (autoCollectReward && coinReward > 0) {
            pendingProgressionReward = { coinReward, onRewardCollected };
            progressionRewardTimeout = window.setTimeout(async () => {
                progressionRewardTimeout = null;
                settlePendingProgressionReward({ animate: true });
            }, 1180);
        }
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

        if (coinCounter) coinCounter.innerText = String(state.coins);
        if (powerCounter) {
            powerCounter.innerText = String(getZooPowerTotal());
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

        renderZooEarningsCard();
    }

    function pulseCoinCounter() {
        const coinCounterWrap = document.getElementById('coin-counter')?.parentElement;
        if (!coinCounterWrap) return;

        coinCounterWrap.classList.remove('coin-counter-pop');
        void coinCounterWrap.offsetWidth;
        coinCounterWrap.classList.add('coin-counter-pop');
    }

    function animateCoinsToHud(coinAmount, options = {}) {
        const gameView = document.getElementById('game-view');
        const layer = document.getElementById('coin-burst-layer');
        const sourceEl = options.sourceEl || document.getElementById('zoo-earnings-chest');
        const targetEl = document.getElementById('coin-counter')?.parentElement;
        const onCoinLand = typeof options.onCoinLand === 'function' ? options.onCoinLand : null;

        if (coinAmount <= 0) {
            return Promise.resolve();
        }

        if (!gameView || !layer || !sourceEl || !targetEl) {
            if (onCoinLand) {
                onCoinLand(coinAmount, 0, 1);
            }
            return Promise.resolve();
        }

        layer.innerHTML = '';

        const gameRect = gameView.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const sourceCenterX = sourceRect.left + (sourceRect.width / 2) - gameRect.left;
        const sourceCenterY = sourceRect.top + (sourceRect.height / 2) - gameRect.top;
        const targetCenterX = targetRect.left + (targetRect.width / 2) - gameRect.left;
        const targetCenterY = targetRect.top + (targetRect.height / 2) - gameRect.top;
        const totalCoins = Math.min(coinAmount, Math.min(18, Math.max(10, Math.round(Math.sqrt(coinAmount) * 2.2))));
        const coinChunks = splitCoinGain(coinAmount, totalCoins);
        const maxDelay = (totalCoins - 1) * 38;

        for (let index = 0; index < totalCoins; index++) {
            const coin = document.createElement('span');
            const burstAngle = (-92 + (index * (184 / Math.max(totalCoins - 1, 1)))) * (Math.PI / 180);
            const burstRadius = 26 + (Math.random() * 34);
            const burstX = Math.cos(burstAngle) * burstRadius;
            const burstY = Math.sin(burstAngle) * burstRadius - (8 + Math.random() * 16);
            const targetX = targetCenterX - sourceCenterX + (-10 + Math.random() * 20);
            const targetY = targetCenterY - sourceCenterY + (-8 + Math.random() * 16);

            coin.className = 'coin-flyer';
            coin.style.left = `${sourceCenterX}px`;
            coin.style.top = `${sourceCenterY}px`;
            coin.style.setProperty('--coin-delay', `${index * 38}ms`);
            coin.style.setProperty('--coin-burst-x', `${burstX}px`);
            coin.style.setProperty('--coin-burst-y', `${burstY}px`);
            coin.style.setProperty('--coin-target-x', `${targetX}px`);
            coin.style.setProperty('--coin-target-y', `${targetY}px`);
            coin.style.setProperty('--coin-rotate-mid', `${90 + Math.random() * 180}deg`);
            coin.style.setProperty('--coin-rotate-end', `${280 + Math.random() * 260}deg`);
            coin.addEventListener('animationend', () => {
                coin.remove();
            }, { once: true });
            layer.appendChild(coin);

            if (onCoinLand) {
                window.setTimeout(() => {
                    onCoinLand(coinChunks[index], index, totalCoins);
                }, (index * 38) + 760);
            }
        }

        return new Promise(resolve => {
            window.setTimeout(() => {
                layer.innerHTML = '';
                resolve();
            }, 980 + maxDelay);
        });
    }

    async function collectZooEarnings(coinAmount, afterCollect) {
        if (coinAmount <= 0 || isZooEarningsCollecting) return;

        isZooEarningsCollecting = true;
        renderZooEarningsCard();

        const startingCoins = state.coins;
        let animatedCoins = 0;

        await animateCoinsToHud(coinAmount, {
            onCoinLand(chunkAmount) {
                animatedCoins += chunkAmount;
                state.coins = startingCoins + animatedCoins;
                updateCoinCounterValue(state.coins);
            }
        });

        state.coins = startingCoins + coinAmount;
        updateCoinCounterValue(state.coins);
        if (typeof afterCollect === 'function') {
            await afterCollect();
        }

        pulseCoinCounter();
        isZooEarningsCollecting = false;
        renderZooEarningsCard();
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
        const cardGrid = document.getElementById('animal-card-grid');
        if (!cardGrid) return;

        cardGrid.innerHTML = '';
        renderHabitatRoamers('habitat-roamers');

        state.animals.forEach(animal => {
            const isUnlocked = state.unlockedCompanionIds.includes(animal.id);
            const isFavorite = state.favoriteMascot === animal.id;

            const card = document.createElement('div');
            card.id = `animal-card-${animal.id}`;
            card.className = `relative rounded-2xl border p-3 shadow-sm ${isUnlocked ? 'bg-white border-emerald-100' : 'bg-slate-100 border-slate-200 opacity-75'}`;

            const favoriteHand = animal.id === favoriteTutorialAnimalId
                ? '<div id="hand-favorite-tutorial" class="onboarding-hand hidden pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-xl pointing-finger">👇</div>'
                : '';
            const upgradeHand = animal.id === upgradeTutorialAnimalId
                ? '<div id="hand-upgrade-tutorial" class="onboarding-hand hidden pointer-events-none absolute -bottom-4 right-3 text-xl pointing-finger">👆</div>'
                : '';

            if (isUnlocked) {
                const isTutorialFreeUpgrade = !state.tutorialComplete && state.tutorialStep === 2 && animal.id === upgradeTutorialAnimalId;
                const shardProgress = getAnimalShardProgress(animal);
                const collectedShards = getAnimalCollectedShards(animal);
                const upgradeCoinCost = getAnimalUpgradeCoinCost(animal);
                const canUpgrade = canUpgradeAnimal(animal, state.coins, { tutorialFree: isTutorialFreeUpgrade });
                const upgradePriceLabel = isTutorialFreeUpgrade ? 'FREE' : `${upgradeCoinCost} coins`;
                const progressPercent = Math.round(shardProgress.progressRatio * 100);
                const upgradeButtonClass = canUpgrade
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                    : 'bg-emerald-100/80 text-emerald-800 opacity-60';
                const upgradeButtonIcon = canUpgrade ? '🔼' : '🔒';
                const favoriteBadge = isFavorite
                    ? '<div class="favorite-growl-badge favorite-growl-badge--card" aria-label="Favorite animal">⭐</div>'
                    : '';

                card.innerHTML = `
                    ${favoriteBadge}
                    ${animal.id === upgradeTutorialAnimalId ? upgradeHand : ''}
                    <div class="flex items-start justify-between gap-3">
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
                    <div class="mt-3 space-y-2.5">
                        <div class="overflow-hidden rounded-full bg-emerald-100/80 ring-1 ring-emerald-200">
                            <div class="h-2.5 rounded-full bg-gradient-to-r from-amber-300 via-emerald-400 to-teal-500 transition-all duration-500" style="width:${progressPercent}%"></div>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Collected shards</span>
                            <span class="font-bold text-slate-700">${collectedShards}/${shardProgress.nextLevelRequirement}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="relative">
                                ${animal.id === favoriteTutorialAnimalId ? favoriteHand : ''}
                                <button data-action="favorite-mascot" data-animal-id="${animal.id}" class="w-full rounded-xl px-2 py-2 text-[10px] font-bold ${isFavorite ? 'bg-amber-400 text-slate-900' : 'bg-amber-50 text-amber-700 border border-amber-200'}">🌟 Fav</button>
                            </div>
                            <button data-action="upgrade-animal" data-animal-id="${animal.id}" class="rounded-xl px-2 py-2 text-[10px] font-bold transition ${upgradeButtonClass}" ${canUpgrade ? '' : 'disabled'}>
                                <span class="flex items-center justify-center gap-1">
                                    <span>${upgradeButtonIcon}</span>
                                    <span>${upgradePriceLabel}</span>
                                </span>
                            </button>
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
        collectZooEarnings,
        getCurrentZooEarnings,
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
        pulseCoinCounter,
        updateCellVisual,
        updateHeaderLogoVisibility,
        updateHeartsUI,
        updateHUD,
        updatePowerUpCostsBadge,
        updateProgressText
    };
}
