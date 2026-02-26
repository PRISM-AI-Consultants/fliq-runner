// Level configuration for FLIQ Runner
// Phase 1: 3 levels with increasing difficulty

export const LEVELS = [
  {
    id: 1,
    name: 'Waking Up',
    description: 'The first lights flicker on...',
    baseSpeed: 10,
    maxSpeed: 14,
    accelerationRate: 0.03,
    // Obstacle frequency (lower = more frequent)
    obstacleInterval: [3.5, 5],
    // Decision frequency
    decisionInterval: [12, 15],
    // What types of obstacles appear
    obstacles: ['streetlight', 'barrier'],
    // What decision categories are available
    decisionCategories: ['saving_vs_spending', 'needs_vs_wants'],
    // Coin density (coins per segment)
    coinDensity: 6,
    // Flow pickup chance
    flowPickupChance: 0.2,
    // Duration in seconds (approximate - ends after decisions + distance)
    targetDuration: 90,
    // Target decisions per level
    targetDecisions: 3,
    // City stage at start
    startingCityStage: 0,
  },
  {
    id: 2,
    name: 'Gaining Momentum',
    description: 'More choices appear on your path...',
    baseSpeed: 13,
    maxSpeed: 17,
    accelerationRate: 0.04,
    obstacleInterval: [2.5, 4],
    decisionInterval: [10, 14],
    obstacles: ['streetlight', 'barrier', 'puddle'],
    decisionCategories: ['saving_vs_spending', 'needs_vs_wants', 'delayed_gratification', 'sharing'],
    coinDensity: 8,
    flowPickupChance: 0.25,
    targetDuration: 120,
    targetDecisions: 5,
    startingCityStage: 1,
  },
  {
    id: 3,
    name: 'Restoring the Flow',
    description: 'The city needs your best choices!',
    baseSpeed: 15,
    maxSpeed: 20,
    accelerationRate: 0.05,
    obstacleInterval: [2, 3.5],
    decisionInterval: [8, 12],
    obstacles: ['streetlight', 'barrier', 'puddle', 'construction'],
    decisionCategories: ['saving_vs_spending', 'needs_vs_wants', 'delayed_gratification', 'sharing', 'risk_assessment', 'budgeting'],
    coinDensity: 10,
    flowPickupChance: 0.3,
    targetDuration: 150,
    targetDecisions: 7,
    startingCityStage: 2,
  },
];

export function getLevelConfig(levelIndex) {
  return LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
}
