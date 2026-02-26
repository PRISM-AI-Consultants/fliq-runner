// Decision point definitions for FLIQ Runner
// Each decision has two options - neither is explicitly labeled right/wrong
// The game tracks what the player chooses to build their FLIQ profile

export const DECISIONS = {
  // === SAVING VS SPENDING ===
  save_toy_store: {
    id: 'save_toy_store',
    category: 'saving_vs_spending',
    level: 1,
    // Visual cues (icons, not text - for 6-year-olds)
    optionA: {
      lane: 'left',
      icon: 'toy',           // Spinning toy/gadget visual
      glowColor: 0xff6b6b,   // Tempting warm red
      flowImpact: -10,
      fliqDimension: 'saveRate',
      fliqWeight: -1,
      resultAnimation: 'drain', // City dims slightly
    },
    optionB: {
      lane: 'right',
      icon: 'piggybank',     // Glowing piggy bank
      glowColor: 0xf5c542,   // Warm gold
      flowImpact: 15,
      fliqDimension: 'saveRate',
      fliqWeight: 2,
      resultAnimation: 'restore', // City lights up
    },
  },

  save_gadget: {
    id: 'save_gadget',
    category: 'saving_vs_spending',
    level: 2,
    optionA: {
      lane: 'left',
      icon: 'gamepad',
      glowColor: 0xff6b6b,
      flowImpact: -12,
      fliqDimension: 'saveRate',
      fliqWeight: -1,
      resultAnimation: 'drain',
    },
    optionB: {
      lane: 'right',
      icon: 'savingsjar',
      glowColor: 0xf5c542,
      flowImpact: 18,
      fliqDimension: 'saveRate',
      fliqWeight: 2,
      resultAnimation: 'restore',
    },
  },

  // === DELAYED GRATIFICATION ===
  delay_small_big: {
    id: 'delay_small_big',
    category: 'delayed_gratification',
    level: 1,
    optionA: {
      lane: 'center',        // Easy grab - small coin right in front
      icon: 'smallcoin',
      glowColor: 0xaaaaaa,
      flowImpact: 3,
      fliqDimension: 'delayTolerance',
      fliqWeight: -1,
      resultAnimation: 'minimal',
    },
    optionB: {
      lane: 'right',         // Behind obstacles - treasure chest
      icon: 'chest',
      glowColor: 0xffd700,
      flowImpact: 25,
      fliqDimension: 'delayTolerance',
      fliqWeight: 3,
      resultAnimation: 'bigRestore',
      requiresObstacleNav: true,
    },
  },

  delay_candy_garden: {
    id: 'delay_candy_garden',
    category: 'delayed_gratification',
    level: 2,
    optionA: {
      lane: 'left',
      icon: 'candy',
      glowColor: 0xff69b4,
      flowImpact: 5,
      fliqDimension: 'delayTolerance',
      fliqWeight: -1,
      resultAnimation: 'minimal',
    },
    optionB: {
      lane: 'right',
      icon: 'flowseed',      // Plant a seed - grows into reward later
      glowColor: 0x4ecdc4,
      flowImpact: 0,         // No immediate reward
      fliqDimension: 'delayTolerance',
      fliqWeight: 3,
      delayedReward: 30,     // Paid out later in the level
      resultAnimation: 'plant',
    },
  },

  // === NEEDS VS WANTS ===
  needs_groceries_icecream: {
    id: 'needs_groceries_icecream',
    category: 'needs_vs_wants',
    level: 1,
    optionA: {
      lane: 'left',
      icon: 'icecream',
      glowColor: 0xff69b4,
      flowImpact: -8,
      fliqDimension: 'needsVsWants',
      fliqWeight: -1,
      resultAnimation: 'drain',
    },
    optionB: {
      lane: 'right',
      icon: 'groceries',
      glowColor: 0x2ecc71,
      flowImpact: 15,
      fliqDimension: 'needsVsWants',
      fliqWeight: 2,
      resultAnimation: 'restore',
    },
  },

  needs_sneakers_books: {
    id: 'needs_sneakers_books',
    category: 'needs_vs_wants',
    level: 2,
    optionA: {
      lane: 'left',
      icon: 'sneakers',
      glowColor: 0xff6b6b,
      flowImpact: -10,
      fliqDimension: 'needsVsWants',
      fliqWeight: -1,
      resultAnimation: 'drain',
    },
    optionB: {
      lane: 'right',
      icon: 'books',
      glowColor: 0x3498db,
      flowImpact: 15,
      fliqDimension: 'needsVsWants',
      fliqWeight: 2,
      resultAnimation: 'restore',
    },
  },

  // === SHARING / GENEROSITY ===
  share_npc_help: {
    id: 'share_npc_help',
    category: 'sharing',
    level: 1,
    optionA: {
      lane: 'center',        // Keep running, ignore NPC
      icon: 'keeprunning',
      glowColor: 0x888888,
      flowImpact: 0,
      fliqDimension: 'generosity',
      fliqWeight: -2,
      resultAnimation: 'none',
    },
    optionB: {
      lane: 'left',          // Stop to help character
      icon: 'helphand',
      glowColor: 0xff9f43,
      flowImpact: 20,
      fliqDimension: 'generosity',
      fliqWeight: 3,
      resultAnimation: 'shareRestore',
    },
  },

  share_lemonade: {
    id: 'share_lemonade',
    category: 'sharing',
    level: 2,
    optionA: {
      lane: 'left',
      icon: 'drinkalone',
      glowColor: 0xf39c12,
      flowImpact: 5,
      fliqDimension: 'generosity',
      fliqWeight: -1,
      resultAnimation: 'minimal',
    },
    optionB: {
      lane: 'right',
      icon: 'sharedrink',
      glowColor: 0xff9f43,
      flowImpact: 15,
      fliqDimension: 'generosity',
      fliqWeight: 3,
      resultAnimation: 'shareRestore',
    },
  },

  // === RISK ASSESSMENT ===
  risk_shortcut: {
    id: 'risk_shortcut',
    category: 'risk_assessment',
    level: 2,
    optionA: {
      lane: 'left',
      icon: 'darkalley',     // Shortcut - risky but faster
      glowColor: 0x2c3e50,
      flowImpact: -15,       // Usually bad outcome
      fliqDimension: 'riskCalibration',
      fliqWeight: -2,
      resultAnimation: 'risky',
      riskOutcome: { good: 0.3, goodReward: 30, badPenalty: -15 },
    },
    optionB: {
      lane: 'right',
      icon: 'safepath',      // Longer but safe
      glowColor: 0x2ecc71,
      flowImpact: 10,
      fliqDimension: 'riskCalibration',
      fliqWeight: 1,
      resultAnimation: 'safe',
    },
  },

  // === BUDGETING ===
  budget_limited: {
    id: 'budget_limited',
    category: 'budgeting',
    level: 3,
    optionA: {
      lane: 'left',
      icon: 'grabeverything', // Grab all items (over budget)
      glowColor: 0xe74c3c,
      flowImpact: -10,
      fliqDimension: 'budgetAdherence',
      fliqWeight: -2,
      resultAnimation: 'overbudget',
    },
    optionB: {
      lane: 'right',
      icon: 'selectcarefully', // Pick only essentials
      glowColor: 0x2ecc71,
      flowImpact: 15,
      fliqDimension: 'budgetAdherence',
      fliqWeight: 2,
      resultAnimation: 'underbudget',
    },
  },
};

// Get decisions for a specific level
export function getDecisionsForLevel(level) {
  return Object.values(DECISIONS).filter(d => d.level <= level);
}

// Get a random decision from available pool for a given level
export function getRandomDecision(level, usedIds = []) {
  const available = getDecisionsForLevel(level).filter(d => !usedIds.includes(d.id));
  if (available.length === 0) {
    // Reset pool if all used
    const all = getDecisionsForLevel(level);
    return all[Math.floor(Math.random() * all.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
