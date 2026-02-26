// Game configuration - central place for all tunable values
export const CONFIG = {
  // Feature flags
  useProductionAssets: false,
  debugMode: false,
  enableTracking: true,

  // Renderer
  renderer: {
    antialias: true,
    pixelRatioMax: 2,
    bloomStrength: 0.4,
    bloomRadius: 0.3,
    bloomThreshold: 0.85,
  },

  // Runner mechanics
  runner: {
    laneWidth: 3,           // Distance between lane centers
    laneCount: 3,           // Left, Center, Right
    laneSwitchSpeed: 8,     // How fast player moves between lanes
    baseSpeed: 12,          // Forward units per second (level 1)
    speedIncrement: 0.3,    // Speed increase per level
    accelerationRate: 0.05, // Speed increase within a level (per second)
    maxSpeedMultiplier: 1.8,
    jumpForce: 12,
    jumpDuration: 0.6,
    slideDuration: 0.6,
    gravity: 30,
  },

  // Camera
  camera: {
    fov: 65,
    near: 0.1,
    far: 150,
    offsetX: 0,
    offsetY: 4,             // Height above player
    offsetZ: 8,             // Distance behind player
    lookAheadY: 1.5,        // Look slightly above player
    lerpSpeed: 5,           // Camera smoothing
  },

  // World generation
  world: {
    segmentLength: 40,      // Length of each city segment
    visibleSegments: 3,     // Segments ahead to render (reduced for performance)
    buildingMinHeight: 4,
    buildingMaxHeight: 12,
    buildingDepth: 4,
    streetWidth: 10,        // Total street width including sidewalks
    sidewalkWidth: 2,
  },

  // Spawn timing
  spawning: {
    coinInterval: 1.5,          // Seconds between coin groups
    obstacleInterval: 3,        // Seconds between obstacles
    decisionInterval: [8, 15],  // Random range for decision points
    flowPickupChance: 0.3,      // Chance a collectible is high-value Flow
    drainPickupChance: 0.15,    // Chance a temptation item spawns
  },

  // Flow economy
  flow: {
    coinValue: 1,
    goodDecision: [10, 25],     // Range for positive decisions
    badDecision: [-5, -15],     // Range for drain decisions
    obstacleHit: -3,
    sharingBonus: 15,
    levelComplete: 50,
    // City restoration thresholds
    thresholds: [
      { flow: 0, label: 'Dim City', lightLevel: 0.4 },
      { flow: 100, label: 'First Lights', lightLevel: 0.55 },
      { flow: 250, label: 'Stores Opening', lightLevel: 0.5 },
      { flow: 500, label: 'City Alive', lightLevel: 0.75 },
      { flow: 750, label: 'Full Restoration', lightLevel: 1.0 },
    ],
  },

  // Session / Levels
  session: {
    levelsPerSession: 3,
    levelDuration: [90, 180], // 1.5 to 3 minutes per level in seconds
  },

  // Colors - Velo City golden hour palette
  colors: {
    skyTop: 0x2a1840,
    skyBottom: 0x6b3a50,
    sunsetGlow: 0xf5a623,
    warmGold: 0xffd700,
    warmAmber: 0xf5a623,
    softPink: 0xe8a0bf,
    deepPurple: 0x2d1b3e,
    brickRed: 0x8b4513,
    concrete: 0x888888,
    grassGreen: 0x4a7c3f,
    darkStreet: 0x333333,
    activationGlow: 0xf5c542,
    flowCyan: 0x4ecdc4,
    drainRed: 0xe74c3c,
    positiveGreen: 0x2ecc71,
  },
};
