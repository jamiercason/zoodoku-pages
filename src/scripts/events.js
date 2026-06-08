export function bindUiEvents({
    getTooltipDetails,
    handlers
}) {
    document.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;

        const { action } = actionEl.dataset;

        switch (action) {
            case 'open-settings':
                handlers.toggleSettingsMenu(true);
                break;
            case 'close-settings':
                handlers.toggleSettingsMenu(false);
                break;
            case 'switch-tab':
                handlers.switchTab(actionEl.dataset.tab);
                break;
            case 'show-tooltip': {
                const details = getTooltipDetails(actionEl.dataset.tooltip);
                if (details) {
                    handlers.showTooltip(details.title, details.text, actionEl);
                }
                break;
            }
            case 'reveal-species':
                handlers.useRevealSpecies();
                break;
            case 'logical-exclusions':
                handlers.useLogicalExclusions();
                break;
            case 'finish-zoo-welcome':
                handlers.finishZooWelcome();
                break;
            case 'tutorial-primary':
                handlers.onTutorialPrimaryAction();
                break;
            case 'progress-step':
                handlers.onNextProgressStep(actionEl.dataset.destination || 'next');
                break;
            case 'confirm-fierce-warning':
                handlers.confirmFierceWarning();
                break;
            case 'toggle-audio':
                handlers.toggleAudioMute();
                break;
            case 'apply-selected-level':
                handlers.applySelectedLevelFromSettings();
                break;
            case 'jump-zoo-ftue':
                handlers.jumpToZooUnlockFtue();
                break;
            case 'replay-intro-ftue':
                handlers.replayIntroFtue();
                break;
            case 'open-rules':
                handlers.toggleHowToPlay(true);
                break;
            case 'open-rules-from-settings':
                handlers.toggleHowToPlay(true);
                handlers.toggleSettingsMenu(false);
                break;
            case 'close-rules':
                handlers.toggleHowToPlay(false);
                break;
            case 'close-chest':
                handlers.onCloseChestAndUnlock(actionEl.dataset.destination || 'next');
                break;
            case 'restart-level':
                handlers.restartCurrentLevel();
                break;
            case 'favorite-mascot':
                handlers.toggleFavoriteMascot(actionEl.dataset.animalId);
                break;
            case 'upgrade-animal':
                handlers.upgradeAnimal(actionEl.dataset.animalId);
                break;
            default:
                break;
        }
    });
}
