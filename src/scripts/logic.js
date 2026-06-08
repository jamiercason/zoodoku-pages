export function solveBoard(gridSize, colorMap) {
    const solutions = [];
    const placed = [];

    function canPlace(r, c) {
        for (const point of placed) {
            if (point.r === r || point.c === c) return false;
        }
        for (const point of placed) {
            if (Math.abs(point.r - r) <= 1 && Math.abs(point.c - c) <= 1) return false;
        }

        const zone = colorMap[r][c];
        for (const point of placed) {
            if (colorMap[point.r][point.c] === zone) return false;
        }
        return true;
    }

    function backtrack(row) {
        if (row === gridSize) {
            solutions.push(placed.map(point => [point.r, point.c]));
            return true;
        }

        for (let col = 0; col < gridSize; col++) {
            if (!canPlace(row, col)) continue;
            placed.push({ r: row, c: col });
            if (backtrack(row + 1)) return true;
            placed.pop();
        }
        return false;
    }

    backtrack(0);
    return solutions;
}

export function calculateTotalPower(animals, unlockedCompanionIds) {
    return animals.reduce((total, animal) => {
        if (!unlockedCompanionIds.includes(animal.id)) return total;
        return total + (animal.level * animal.powerMultiplier);
    }, 0);
}

export function computeProgressionForLevel(levelNumber, initialAnimals, starterAnimalId) {
    const targetLevel = Math.max(1, Math.floor(levelNumber || 1));
    let completedLevels = targetLevel - 1;
    let chestGoal = 3;
    const unlockedIds = [starterAnimalId];
    let chestUnlocks = 0;

    while (completedLevels >= chestGoal) {
        completedLevels -= chestGoal;
        if (unlockedIds.length < initialAnimals.length) {
            unlockedIds.push(initialAnimals[unlockedIds.length].id);
        }
        chestGoal++;
        chestUnlocks++;
    }

    return {
        currentLevelNumber: targetLevel,
        chestGoal,
        chestProgress: completedLevels,
        unlockedCompanionIds: unlockedIds,
        zooUnlocked: unlockedIds.length >= 2,
        coins: 200 + ((targetLevel - 1) * 50) + (chestUnlocks * 100)
    };
}

export function getLevelDifficulty(levelNumber) {
    if (levelNumber % 9 === 0) return "VERY HARD";
    if (levelNumber % 8 === 0) return "HARD";
    return "EASY";
}

export function getDifficultySeedKey(difficulty) {
    if (difficulty === "VERY HARD") return "veryHard";
    if (difficulty === "HARD") return "hard";
    return "easy";
}

export function getDifficultySequenceIndex(levelNumber, difficulty) {
    let sequenceIndex = 0;
    for (let level = 1; level <= levelNumber; level++) {
        if (getLevelDifficulty(level) === difficulty) {
            sequenceIndex++;
        }
    }
    return Math.max(sequenceIndex - 1, 0);
}

export function reorderPalette(colors, shift) {
    const size = colors.length;
    if (!size) return [];
    return Array.from({ length: size }, (_, index) => colors[(index + shift) % size]);
}

export function buildLayoutFingerprint(colorMap) {
    const zoneSizes = {};
    colorMap.forEach(row => {
        row.forEach(zoneId => {
            zoneSizes[zoneId] = (zoneSizes[zoneId] || 0) + 1;
        });
    });

    return colorMap
        .map(row => row.join(""))
        .join("|") + `::${Object.values(zoneSizes).sort((a, b) => a - b).join("-")}`;
}

export function createLayoutFromSeed(seedLevel, transformIndex, colorShift, symmetryTransforms) {
    const transform = symmetryTransforms[transformIndex % symmetryTransforms.length] || symmetryTransforms[0];
    return {
        gridSize: seedLevel.gridSize,
        colors: reorderPalette(seedLevel.colors, colorShift % seedLevel.colors.length),
        colorMap: transform(seedLevel.colorMap, seedLevel.gridSize)
    };
}

export function selectLevelLayout(levelNumber, difficulty, baseSeeds, symmetryTransforms) {
    const seedKey = getDifficultySeedKey(difficulty);
    const seedLibrary = baseSeeds[seedKey];
    const sequenceIndex = getDifficultySequenceIndex(levelNumber, difficulty);

    if (difficulty === "EASY" && levelNumber === 1) {
        return createLayoutFromSeed(seedLibrary[0], 0, 0, symmetryTransforms);
    }

    const candidateCount = seedLibrary.length * symmetryTransforms.length;
    const cycleIndex = sequenceIndex % candidateCount;
    const previousCycleIndex = (sequenceIndex + candidateCount - 1) % candidateCount;

    let seedIndex = cycleIndex % seedLibrary.length;
    let transformIndex = Math.floor(cycleIndex / seedLibrary.length) % symmetryTransforms.length;
    let layout = createLayoutFromSeed(
        seedLibrary[seedIndex],
        transformIndex,
        levelNumber % seedLibrary[seedIndex].colors.length,
        symmetryTransforms
    );

    if (sequenceIndex > 0) {
        const previousSeedIndex = previousCycleIndex % seedLibrary.length;
        const previousTransformIndex = Math.floor(previousCycleIndex / seedLibrary.length) % symmetryTransforms.length;
        const previousLayout = createLayoutFromSeed(
            seedLibrary[previousSeedIndex],
            previousTransformIndex,
            (levelNumber - 1) % seedLibrary[previousSeedIndex].colors.length,
            symmetryTransforms
        );

        if (buildLayoutFingerprint(layout.colorMap) === buildLayoutFingerprint(previousLayout.colorMap)) {
            seedIndex = (seedIndex + 1) % seedLibrary.length;
            transformIndex = (transformIndex + 1) % symmetryTransforms.length;
            layout = createLayoutFromSeed(
                seedLibrary[seedIndex],
                transformIndex,
                (levelNumber + 1) % seedLibrary[seedIndex].colors.length,
                symmetryTransforms
            );
        }
    }

    return layout;
}

export function generateEnvironmentalZoneAssignments({
    level,
    totalZones,
    animals,
    unlockedCompanionIds,
    favoriteMascot,
    starterAnimalId,
    random = Math.random
}) {
    const assignments = {};

    for (let zoneIndex = 0; zoneIndex < totalZones; zoneIndex++) {
        const pool = [];

        animals.forEach(animal => {
            if (!unlockedCompanionIds.includes(animal.id)) return;

            let weight = 10;
            let isSuitable = false;

            if (animal.prefLocation.includes(level.location)) {
                weight += 15;
                isSuitable = true;
            } else {
                weight -= 4;
            }

            if (animal.prefTime === level.time) {
                weight += 10;
                isSuitable = true;
            } else {
                weight -= 3;
            }

            if (animal.prefTemp === level.temp) {
                weight += 10;
                isSuitable = true;
            } else {
                weight -= 3;
            }

            if (favoriteMascot === animal.id) {
                weight += isSuitable ? 30 : 5;
            }

            pool.push({ animal, weight: Math.max(weight, 2) });
        });

        const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        let rolledAnimalId = starterAnimalId;
        let threshold = random() * totalWeight;

        for (const item of pool) {
            threshold -= item.weight;
            if (threshold <= 0) {
                rolledAnimalId = item.animal.id;
                break;
            }
        }

        assignments[zoneIndex] = rolledAnimalId;
    }

    return assignments;
}

export function getSolvedAnimalSummary(finalAnimals = [], levelZoneAssignments, animals, initialAnimals) {
    const counts = new Map();

    finalAnimals.forEach(({ zone }) => {
        const animalId = levelZoneAssignments[zone];
        if (!animalId) return;
        counts.set(animalId, (counts.get(animalId) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([animalId, count]) => ({
            animalId,
            count,
            animal: animals.find(entry => entry.id === animalId) || initialAnimals.find(entry => entry.id === animalId)
        }))
        .filter(entry => entry.animal)
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.animal.name.localeCompare(b.animal.name);
        });
}
