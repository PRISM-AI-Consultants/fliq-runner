// FLIQ Score dimensions and weights
// FLIQ = Financial Literacy IQ - a behavioral profile, NOT pass/fail

export const FLIQ_DIMENSIONS = {
  saveRate: {
    label: 'Spending Awareness',
    icon: 'piggybank',
    weight: 0.20,
    description: 'How thoughtfully you use your Flow energy',
    positiveTitle: 'Super Saver!',
    encouragement: 'You love sharing energy with Velo City! Try saving some for later next time.',
  },
  delayTolerance: {
    label: 'Patience Power',
    icon: 'hourglass',
    weight: 0.20,
    description: 'Your ability to wait for better rewards',
    positiveTitle: 'Patience Pro!',
    encouragement: 'Quick decisions can be exciting! Try waiting to see what bigger rewards await.',
  },
  needsVsWants: {
    label: 'Smart Choices',
    icon: 'groceries',
    weight: 0.15,
    description: 'How well you know what you really need',
    positiveTitle: 'Wise Chooser!',
    encouragement: 'Fun things are great! Next time, check if there is something you need first.',
  },
  generosity: {
    label: 'Generous Heart',
    icon: 'heart',
    weight: 0.15,
    description: 'How you help others in Velo City',
    positiveTitle: 'Generous Hero!',
    encouragement: 'Try stopping to help friends next time - sharing makes the city stronger!',
  },
  riskCalibration: {
    label: 'Smart Risk',
    icon: 'shield',
    weight: 0.15,
    description: 'How well you balance safe and brave choices',
    positiveTitle: 'Brave Explorer!',
    encouragement: 'Every path teaches something! Keep exploring different routes.',
  },
  budgetAdherence: {
    label: 'Budget Boss',
    icon: 'calculator',
    weight: 0.15,
    description: 'How well you manage your Flow energy',
    positiveTitle: 'Budget Master!',
    encouragement: 'Managing energy takes practice. You are getting better every run!',
  },
};

// FLIQ level badges based on overall score
export const FLIQ_LEVELS = [
  { minScore: 0, title: 'Flow Finder', color: '#95a5a6' },
  { minScore: 30, title: 'Grid Guardian', color: '#4ecdc4' },
  { minScore: 50, title: 'Energy Explorer', color: '#3498db' },
  { minScore: 70, title: 'Power Pathfinder', color: '#f5a623' },
  { minScore: 85, title: 'Velo Visionary', color: '#ffd700' },
];

// Response time categories for decision analysis
export const RESPONSE_TIME = {
  impulsive: { maxMs: 1000, label: 'Quick', weight: 0.6 },
  deliberate: { maxMs: 4000, label: 'Thoughtful', weight: 1.0 },
  indecisive: { maxMs: Infinity, label: 'Careful', weight: 0.8 },
};

export function getResponseCategory(ms) {
  if (ms < RESPONSE_TIME.impulsive.maxMs) return 'impulsive';
  if (ms < RESPONSE_TIME.deliberate.maxMs) return 'deliberate';
  return 'indecisive';
}
