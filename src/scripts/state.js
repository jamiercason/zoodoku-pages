import { SAVE_KEY, STARTER_ANIMAL_ID, initialAnimals } from "./data.js";

export function cloneInitialAnimals() {
    return JSON.parse(JSON.stringify(initialAnimals));
}

export const state = {
    coins: 200,
    favoriteMascot: STARTER_ANIMAL_ID,
    hearts: 3,
    currentLevelNumber: 1,
    chestProgress: 0,
    chestGoal: 3,
    zooEarningsLastCollectedAt: Date.now(),
    animals: cloneInitialAnimals(),
    gridState: [],
    brushMode: "cycle",
    unlockedCompanionIds: [STARTER_ANIMAL_ID],
    levelZoneAssignments: {},
    zooUnlocked: false,
    zooWelcomeSeen: false,
    gameFtueComplete: false,
    tutorialComplete: false,
    tutorialStep: 0
};

function getLegacyCollectedShardEstimate(savedAnimal, defaultAnimal) {
    const savedLevel = Math.max(1, Math.floor(savedAnimal?.level ?? defaultAnimal.level ?? 1));
    const legacyShards = Math.max(0, Math.floor(savedAnimal?.shards ?? 0));
    let collectedTotal = legacyShards;

    for (let level = 1; level < savedLevel; level++) {
        collectedTotal += Math.ceil(defaultAnimal.requiredShards * Math.pow(1.35, level - 1));
    }

    return collectedTotal;
}

export function mergeAnimalProgress(savedAnimals = []) {
    const savedById = new Map(savedAnimals.map(animal => [animal.id, animal]));
    return initialAnimals.map(defaultAnimal => {
        const saved = savedById.get(defaultAnimal.id);
        if (!saved) return { ...defaultAnimal };

        return {
            ...defaultAnimal,
            level: saved.level ?? defaultAnimal.level,
            shardsCollected: saved.shardsCollected ?? getLegacyCollectedShardEstimate(saved, defaultAnimal)
        };
    });
}

export function loadState(targetState = state) {
    try {
        const stored = localStorage.getItem(SAVE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        const unlockedIds = parsed.unlockedCompanionIds;
        const hasZooProgress = parsed.zooUnlocked || (Array.isArray(unlockedIds) && unlockedIds.length > 1);
        const now = Date.now();
        const fallbackZooTimestamp = hasZooProgress
            ? now - (3 * 60 * 1000)
            : now;
        if (parsed.coins !== undefined) targetState.coins = parsed.coins;
        if (parsed.favoriteMascot !== undefined) targetState.favoriteMascot = parsed.favoriteMascot;
        if (parsed.currentLevelNumber !== undefined) targetState.currentLevelNumber = parsed.currentLevelNumber;
        if (parsed.chestProgress !== undefined) targetState.chestProgress = parsed.chestProgress;
        if (parsed.chestGoal !== undefined) targetState.chestGoal = parsed.chestGoal;
        if (parsed.zooEarningsLastCollectedAt !== undefined) {
            targetState.zooEarningsLastCollectedAt = parsed.zooEarningsLastCollectedAt;
        } else {
            // Seed a short offline window for older saves so idle income starts visibly working after this feature lands.
            targetState.zooEarningsLastCollectedAt = fallbackZooTimestamp;
        }
        if (parsed.animals !== undefined) targetState.animals = mergeAnimalProgress(parsed.animals);
        if (parsed.unlockedCompanionIds !== undefined) targetState.unlockedCompanionIds = parsed.unlockedCompanionIds;
        if (parsed.zooUnlocked !== undefined) targetState.zooUnlocked = parsed.zooUnlocked;
        if (parsed.zooWelcomeSeen !== undefined) targetState.zooWelcomeSeen = parsed.zooWelcomeSeen;
        if (parsed.gameFtueComplete !== undefined) targetState.gameFtueComplete = parsed.gameFtueComplete;
        if (parsed.tutorialComplete !== undefined) targetState.tutorialComplete = parsed.tutorialComplete;
        if (parsed.tutorialStep !== undefined) targetState.tutorialStep = parsed.tutorialStep;
        const normalizedZooTimestamp = Number(targetState.zooEarningsLastCollectedAt);
        if (!Number.isFinite(normalizedZooTimestamp) || normalizedZooTimestamp > now) {
            targetState.zooEarningsLastCollectedAt = fallbackZooTimestamp;
        } else {
            targetState.zooEarningsLastCollectedAt = normalizedZooTimestamp;
        }
    } catch (err) {
        console.error("Local storage loading exception:", err);
    }
}

export function saveState(targetState = state) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            coins: targetState.coins,
            favoriteMascot: targetState.favoriteMascot,
            currentLevelNumber: targetState.currentLevelNumber,
            chestProgress: targetState.chestProgress,
            chestGoal: targetState.chestGoal,
            zooEarningsLastCollectedAt: targetState.zooEarningsLastCollectedAt,
            animals: targetState.animals,
            unlockedCompanionIds: targetState.unlockedCompanionIds,
            zooUnlocked: targetState.zooUnlocked,
            zooWelcomeSeen: targetState.zooWelcomeSeen,
            gameFtueComplete: targetState.gameFtueComplete,
            tutorialComplete: targetState.tutorialComplete,
            tutorialStep: targetState.tutorialStep
        }));
    } catch (err) {
        console.error("Local storage saving exception:", err);
    }
}
