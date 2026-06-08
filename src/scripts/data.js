export const baseSeeds = {
    easy: [
        {
            gridSize: 5,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac"],
            colorMap: [
                [3, 0, 1, 1, 1],
                [3, 3, 2, 1, 1],
                [3, 2, 2, 2, 4],
                [3, 3, 4, 4, 4],
                [3, 4, 4, 4, 4]
            ]
        },
        {
            gridSize: 5,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac"],
            colorMap: [
                [1, 1, 0, 0, 0],
                [1, 1, 2, 2, 0],
                [4, 1, 2, 3, 0],
                [4, 2, 2, 3, 3],
                [4, 4, 4, 4, 3]
            ]
        },
        {
            gridSize: 5,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac"],
            colorMap: [
                [0, 0, 0, 1, 1],
                [0, 2, 0, 1, 1],
                [0, 2, 1, 1, 3],
                [2, 2, 4, 4, 3],
                [2, 2, 4, 4, 3]
            ]
        },
        {
            gridSize: 5,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac"],
            colorMap: [
                [1, 1, 0, 0, 2],
                [1, 0, 0, 2, 2],
                [1, 1, 0, 2, 4],
                [1, 3, 3, 2, 4],
                [3, 3, 3, 4, 4]
            ]
        },
        {
            gridSize: 5,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac"],
            colorMap: [
                [0, 0, 0, 1, 1],
                [0, 3, 1, 1, 2],
                [3, 3, 2, 2, 2],
                [3, 3, 3, 4, 4],
                [3, 4, 4, 4, 4]
            ]
        }
    ],
    hard: [
        {
            gridSize: 7,
            colors: ["#fda4af", "#bae6fd", "#86efac", "#d8b4fe", "#fde68a", "#fed7aa", "#c7d2fe"],
            colorMap: [
                [0, 0, 0, 2, 2, 2, 2],
                [0, 1, 1, 2, 2, 2, 2],
                [3, 3, 3, 2, 2, 2, 4],
                [3, 3, 3, 2, 2, 4, 4],
                [3, 3, 3, 3, 4, 4, 4],
                [3, 3, 3, 5, 4, 4, 4],
                [3, 5, 5, 5, 4, 4, 6]
            ]
        },
        {
            gridSize: 7,
            colors: ["#fda4af", "#bae6fd", "#86efac", "#d8b4fe", "#fde68a", "#fed7aa", "#c7d2fe"],
            colorMap: [
                [2, 0, 0, 0, 1, 1, 1],
                [2, 2, 0, 1, 1, 1, 3],
                [2, 2, 0, 1, 1, 3, 3],
                [2, 2, 0, 0, 3, 3, 3],
                [2, 2, 0, 5, 5, 4, 4],
                [5, 5, 5, 5, 4, 4, 4],
                [5, 5, 5, 4, 4, 6, 6]
            ]
        }
    ],
    veryHard: [
        {
            gridSize: 9,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac", "#7dd3fc", "#fed7aa", "#e0e7ff", "#fbcfe8"],
            colorMap: [
                [0, 0, 0, 1, 2, 2, 2, 2, 2],
                [0, 1, 1, 1, 1, 2, 2, 2, 2],
                [3, 3, 1, 1, 2, 2, 2, 2, 2],
                [3, 3, 3, 4, 4, 4, 4, 4, 5],
                [3, 3, 3, 4, 4, 4, 4, 5, 5],
                [3, 3, 3, 4, 4, 4, 5, 5, 5],
                [3, 3, 4, 4, 4, 4, 5, 5, 6],
                [3, 4, 4, 4, 4, 7, 7, 8, 8],
                [3, 7, 7, 7, 7, 7, 8, 8, 8]
            ]
        },
        {
            gridSize: 9,
            colors: ["#fda4af", "#5eead4", "#fde68a", "#d8b4fe", "#86efac", "#7dd3fc", "#fed7aa", "#e0e7ff", "#fbcfe8"],
            colorMap: [
                [2, 0, 0, 1, 1, 3, 3, 3, 3],
                [2, 0, 1, 1, 3, 3, 3, 3, 3],
                [2, 2, 2, 1, 3, 3, 3, 4, 6],
                [5, 5, 3, 3, 3, 4, 4, 4, 6],
                [5, 5, 5, 3, 7, 4, 4, 4, 6],
                [5, 5, 5, 7, 7, 7, 4, 4, 6],
                [5, 5, 5, 8, 8, 7, 7, 4, 6],
                [8, 8, 8, 8, 8, 7, 7, 6, 6],
                [8, 8, 8, 8, 8, 8, 7, 6, 6]
            ]
        }
    ]
};

export const symmetryTransforms = [
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[r][c])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[size - 1 - c][r])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[size - 1 - r][size - 1 - c])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[c][size - 1 - r])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[r][size - 1 - c])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[size - 1 - r][c])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[c][r])),
    (map, size) => Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => map[size - 1 - c][size - 1 - r]))
];

export const locations = ["JUNGLE", "SAVANNA", "ARCTIC", "FOREST", "DESERT"];
export const times = ["DAY", "NIGHT"];
export const temps = ["HOT", "COLD", "MODERATE"];
export const SAVE_KEY = "zoodoku_progression_roster_v7";
export const ANIMAL_ASSET_BASE_PATH = "../assets/animals";

export const initialAnimals = [
    { id: "lion", name: "Lion", assetId: "lion", level: 1, shardsCollected: 0, requiredShards: 10, powerMultiplier: 10, cost: 0, prefLocation: ["SAVANNA"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "elephant", name: "Elephant", assetId: "elephant", level: 1, shardsCollected: 0, requiredShards: 12, powerMultiplier: 15, cost: 100, prefLocation: ["SAVANNA"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "tiger", name: "Tiger", assetId: "tiger", level: 1, shardsCollected: 0, requiredShards: 14, powerMultiplier: 18, cost: 200, prefLocation: ["JUNGLE"], prefTime: "NIGHT", prefTemp: "HOT" },
    { id: "cat", name: "Cat", assetId: "cat", level: 1, shardsCollected: 0, requiredShards: 16, powerMultiplier: 22, cost: 300, prefLocation: ["FOREST"], prefTime: "NIGHT", prefTemp: "MODERATE" },
    { id: "wolf", name: "Wolf", assetId: "wolf", level: 1, shardsCollected: 0, requiredShards: 18, powerMultiplier: 24, cost: 400, prefLocation: ["FOREST"], prefTime: "NIGHT", prefTemp: "COLD" },
    { id: "arctic_fox", name: "Arctic Fox", assetId: "arctic_fox", level: 1, shardsCollected: 0, requiredShards: 20, powerMultiplier: 26, cost: 500, prefLocation: ["ARCTIC"], prefTime: "NIGHT", prefTemp: "COLD" },
    { id: "dog", name: "Yellow Labrador Retriever", assetId: "dog", level: 1, shardsCollected: 0, requiredShards: 22, powerMultiplier: 28, cost: 600, prefLocation: ["FOREST", "SAVANNA"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "chimpanzee", name: "Chimpanzee", assetId: "chimpanzee", level: 1, shardsCollected: 0, requiredShards: 24, powerMultiplier: 30, cost: 700, prefLocation: ["JUNGLE"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "panda", name: "Panda", assetId: "panda", level: 1, shardsCollected: 0, requiredShards: 26, powerMultiplier: 34, cost: 800, prefLocation: ["FOREST", "JUNGLE"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "polar_bear", name: "Polar Bear", assetId: "polar_bear", level: 1, shardsCollected: 0, requiredShards: 28, powerMultiplier: 38, cost: 900, prefLocation: ["ARCTIC"], prefTime: "DAY", prefTemp: "COLD" },
    { id: "koala", name: "Koala", assetId: "koala", level: 1, shardsCollected: 0, requiredShards: 30, powerMultiplier: 42, cost: 1000, prefLocation: ["FOREST"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "honey_badger", name: "Honey Badger", assetId: "honey_badger", level: 1, shardsCollected: 0, requiredShards: 32, powerMultiplier: 46, cost: 1100, prefLocation: ["SAVANNA", "FOREST"], prefTime: "NIGHT", prefTemp: "HOT" },
    { id: "zebra", name: "Zebra", assetId: "zebra", level: 1, shardsCollected: 0, requiredShards: 34, powerMultiplier: 50, cost: 1200, prefLocation: ["SAVANNA"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "rhino", name: "Rhinoceros", assetId: "rhino", level: 1, shardsCollected: 0, requiredShards: 36, powerMultiplier: 54, cost: 1300, prefLocation: ["SAVANNA"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "tapir", name: "Tapir", assetId: "tapir", level: 1, shardsCollected: 0, requiredShards: 38, powerMultiplier: 58, cost: 1400, prefLocation: ["JUNGLE", "FOREST"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "capybara", name: "Capybara", assetId: "capybara", level: 1, shardsCollected: 0, requiredShards: 40, powerMultiplier: 62, cost: 1500, prefLocation: ["JUNGLE", "FOREST"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "goat", name: "Goat", assetId: "goat", level: 1, shardsCollected: 0, requiredShards: 42, powerMultiplier: 66, cost: 1600, prefLocation: ["SAVANNA", "FOREST"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "sheep", name: "Sheep", assetId: "sheep", level: 1, shardsCollected: 0, requiredShards: 44, powerMultiplier: 70, cost: 1700, prefLocation: ["FOREST", "SAVANNA"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "horse", name: "Horse", assetId: "horse", level: 1, shardsCollected: 0, requiredShards: 46, powerMultiplier: 74, cost: 1800, prefLocation: ["SAVANNA", "FOREST"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "water_buffalo", name: "Water Buffalo", assetId: "water_buffalo", level: 1, shardsCollected: 0, requiredShards: 48, powerMultiplier: 78, cost: 1900, prefLocation: ["SAVANNA"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "pig", name: "Pig", assetId: "pig", level: 1, shardsCollected: 0, requiredShards: 50, powerMultiplier: 82, cost: 2000, prefLocation: ["FOREST"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "eagle", name: "Eagle", assetId: "eagle", level: 1, shardsCollected: 0, requiredShards: 52, powerMultiplier: 86, cost: 2100, prefLocation: ["FOREST", "SAVANNA"], prefTime: "DAY", prefTemp: "COLD" },
    { id: "flamingo", name: "Flamingo", assetId: "flamingo", level: 1, shardsCollected: 0, requiredShards: 54, powerMultiplier: 90, cost: 2200, prefLocation: ["SAVANNA", "DESERT"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "chicken", name: "Chicken", assetId: "chicken", level: 1, shardsCollected: 0, requiredShards: 56, powerMultiplier: 94, cost: 2300, prefLocation: ["FOREST"], prefTime: "DAY", prefTemp: "MODERATE" },
    { id: "penguin", name: "Penguin", assetId: "penguin", level: 1, shardsCollected: 0, requiredShards: 58, powerMultiplier: 98, cost: 2400, prefLocation: ["ARCTIC"], prefTime: "DAY", prefTemp: "COLD" },
    { id: "cobra", name: "Cobra", assetId: "cobra", level: 1, shardsCollected: 0, requiredShards: 60, powerMultiplier: 102, cost: 2500, prefLocation: ["DESERT"], prefTime: "NIGHT", prefTemp: "HOT" },
    { id: "alligator", name: "Alligator", assetId: "alligator", level: 1, shardsCollected: 0, requiredShards: 62, powerMultiplier: 106, cost: 2600, prefLocation: ["JUNGLE"], prefTime: "DAY", prefTemp: "HOT" },
    { id: "orca", name: "Orca", assetId: "orca", level: 1, shardsCollected: 0, requiredShards: 64, powerMultiplier: 110, cost: 2700, prefLocation: ["ARCTIC"], prefTime: "NIGHT", prefTemp: "COLD" },
    { id: "walrus", name: "Walrus", assetId: "walrus", level: 1, shardsCollected: 0, requiredShards: 66, powerMultiplier: 114, cost: 2800, prefLocation: ["ARCTIC"], prefTime: "DAY", prefTemp: "COLD" },
    { id: "meerkat", name: "Meerkat", assetId: "meerkat", level: 1, shardsCollected: 0, requiredShards: 68, powerMultiplier: 118, cost: 2900, prefLocation: ["DESERT"], prefTime: "DAY", prefTemp: "HOT" }
];

export const STARTER_ANIMAL_ID = initialAnimals[0].id;
export const FAVORITE_TUTORIAL_ANIMAL_ID = initialAnimals[1]?.id || STARTER_ANIMAL_ID;
export const UPGRADE_TUTORIAL_ANIMAL_ID = STARTER_ANIMAL_ID;
