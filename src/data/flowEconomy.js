// Flow economy values and city restoration thresholds

export const FLOW_VALUES = {
  coin: 1,
  obstacle_hit: -3,
  level_complete: 50,
  sharing_npc: 15,

  // Decision outcomes by category
  decisions: {
    saving_vs_spending: { good: 15, bad: -10 },
    delayed_gratification: { good: 25, bad: 5 },  // Even "bad" gives a little (small coin)
    needs_vs_wants: { good: 15, bad: -10 },
    sharing: { good: 20, bad: -5 },
    risk_assessment: { good: 20, bad: -15 },
    budgeting: { good: 15, bad: -10 },
  },
};

// City restoration stages - visual feedback based on cumulative Flow
export const CITY_STAGES = [
  {
    minFlow: 0,
    label: 'Dim City',
    description: 'The city is quiet at dusk...',
    ambientIntensity: 0.5,
    sunIntensity: 0.6,
    buildingLitRatio: 0.15,
    streetlightRatio: 0.2,
    fogDensity: 0.015,
    musicEnergy: 0,
  },
  {
    minFlow: 100,
    label: 'First Lights',
    description: 'Streetlights flicker on...',
    ambientIntensity: 0.6,
    sunIntensity: 0.75,
    buildingLitRatio: 0.35,
    streetlightRatio: 0.45,
    fogDensity: 0.012,
    musicEnergy: 1,
  },
  {
    minFlow: 250,
    label: 'Stores Opening',
    description: 'Storefronts glow with warm light!',
    ambientIntensity: 0.75,
    sunIntensity: 0.9,
    buildingLitRatio: 0.6,
    streetlightRatio: 0.7,
    fogDensity: 0.008,
    musicEnergy: 2,
  },
  {
    minFlow: 500,
    label: 'City Alive',
    description: 'The city is buzzing with energy!',
    ambientIntensity: 0.9,
    sunIntensity: 1.1,
    buildingLitRatio: 0.85,
    streetlightRatio: 0.9,
    fogDensity: 0.005,
    musicEnergy: 3,
  },
  {
    minFlow: 750,
    label: 'Full Restoration',
    description: 'Velo City shines bright!',
    ambientIntensity: 1.1,
    sunIntensity: 1.4,
    buildingLitRatio: 1.0,
    streetlightRatio: 1.0,
    fogDensity: 0.003,
    musicEnergy: 4,
  },
];

// Get the current city stage based on flow amount
export function getCityStage(flow) {
  let stage = CITY_STAGES[0];
  for (const s of CITY_STAGES) {
    if (flow >= s.minFlow) stage = s;
    else break;
  }
  return stage;
}

// Get restoration percentage (0-1) for smooth interpolation
export function getRestorationPercent(flow) {
  const maxFlow = CITY_STAGES[CITY_STAGES.length - 1].minFlow;
  return Math.min(flow / maxFlow, 1);
}
