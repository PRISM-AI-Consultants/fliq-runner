// Decision point definitions for FLIQ Runner
// Each decision has two options - neither is explicitly labeled right/wrong
// The game tracks what the player chooses to build their FLIQ profile
//
// DESIGN RULES:
// - ALL icon-based using emoji - NO text reading required (ages 6-10)
// - No "right answer" labels - game just tracks what player CHOOSES
// - Some decisions intentionally ambiguous to measure nuance
//
// Schema per decision:
//   id, category, description (dev-only),
//   optionA / optionB each have: label, icon (emoji), lane (0=left, 2=right),
//     flowImpact, fliqWeight
//   Optional: delayedReward (number), requiresObstacleNav (boolean),
//     riskOutcome ({ good: 0-1, goodReward: number, badPenalty: number })

export const DECISIONS = {

  // =============================================
  // === SAVING VS SPENDING (4 decisions) ========
  // =============================================

  save_piggybank_vs_toystore: {
    id: 'save_piggybank_vs_toystore',
    category: 'saving_vs_spending',
    description: 'Save in piggy bank or spend at toy store',
    optionA: {
      label: 'Piggy Bank',
      icon: '🐷',
      lane: 0,
      flowImpact: 15,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Toy Store',
      icon: '🧸',
      lane: 2,
      flowImpact: -10,
      fliqWeight: -1,
    },
  },

  save_coins_vs_gadget: {
    id: 'save_coins_vs_gadget',
    category: 'saving_vs_spending',
    description: 'Save coins in jar or buy gadget at shop',
    optionA: {
      label: 'Save Coins',
      icon: '🪙',
      lane: 0,
      flowImpact: 18,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Gadget Shop',
      icon: '🎮',
      lane: 2,
      flowImpact: -12,
      fliqWeight: -1,
    },
  },

  save_jar_vs_candy: {
    id: 'save_jar_vs_candy',
    category: 'saving_vs_spending',
    description: 'Put money in savings jar or spend at candy store',
    optionA: {
      label: 'Savings Jar',
      icon: '🏺',
      lane: 0,
      flowImpact: 14,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Candy Store',
      icon: '🍭',
      lane: 2,
      flowImpact: -8,
      fliqWeight: -1,
    },
  },

  save_deposit_vs_sneakers: {
    id: 'save_deposit_vs_sneakers',
    category: 'saving_vs_spending',
    description: 'Deposit money in safe box or buy sneakers',
    optionA: {
      label: 'Deposit Box',
      icon: '🔐',
      lane: 0,
      flowImpact: 16,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Sneaker Shop',
      icon: '👟',
      lane: 2,
      flowImpact: -11,
      fliqWeight: -1,
    },
  },

  // =============================================
  // === DELAYED GRATIFICATION (4 decisions) =====
  // =============================================

  delay_smallcoin_vs_chest: {
    id: 'delay_smallcoin_vs_chest',
    category: 'delayed_gratification',
    description: 'Grab small coin now or navigate obstacles to reach big treasure chest',
    optionA: {
      label: 'Small Coin Now',
      icon: '🪙',
      lane: 0,
      flowImpact: 3,
      fliqWeight: -1,
    },
    optionB: {
      label: 'Treasure Chest',
      icon: '💎',
      lane: 2,
      flowImpact: 25,
      fliqWeight: 3,
      requiresObstacleNav: true,
    },
  },

  delay_candy_vs_garden: {
    id: 'delay_candy_vs_garden',
    category: 'delayed_gratification',
    description: 'Eat candy now or plant a garden seed for bigger harvest later',
    optionA: {
      label: 'Candy Now',
      icon: '🍬',
      lane: 0,
      flowImpact: 5,
      fliqWeight: -1,
    },
    optionB: {
      label: 'Plant Garden',
      icon: '🌱',
      lane: 2,
      flowImpact: 0,
      fliqWeight: 3,
      delayedReward: 30,
    },
  },

  delay_snack_vs_homemeal: {
    id: 'delay_snack_vs_homemeal',
    category: 'delayed_gratification',
    description: 'Quick snack now or wait for bigger home-cooked meal',
    optionA: {
      label: 'Quick Snack',
      icon: '🍟',
      lane: 0,
      flowImpact: 4,
      fliqWeight: -1,
    },
    optionB: {
      label: 'Home-Cooked Meal',
      icon: '🍲',
      lane: 2,
      flowImpact: 0,
      fliqWeight: 3,
      delayedReward: 22,
    },
  },

  delay_smallgift_vs_biggift: {
    id: 'delay_smallgift_vs_biggift',
    category: 'delayed_gratification',
    description: 'Open small gift now or wait for a much bigger gift later',
    optionA: {
      label: 'Small Gift Now',
      icon: '🎁',
      lane: 0,
      flowImpact: 6,
      fliqWeight: -1,
    },
    optionB: {
      label: 'Big Gift Later',
      icon: '📦',
      lane: 2,
      flowImpact: 0,
      fliqWeight: 3,
      delayedReward: 35,
      requiresObstacleNav: true,
    },
  },

  // =============================================
  // === NEEDS VS WANTS (4 decisions) ============
  // =============================================

  needs_groceries_vs_icecream: {
    id: 'needs_groceries_vs_icecream',
    category: 'needs_vs_wants',
    description: 'Buy groceries for the family or get ice cream',
    optionA: {
      label: 'Groceries',
      icon: '🥦',
      lane: 0,
      flowImpact: 15,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Ice Cream',
      icon: '🍦',
      lane: 2,
      flowImpact: -8,
      fliqWeight: -1,
    },
  },

  needs_schoolsupplies_vs_videogames: {
    id: 'needs_schoolsupplies_vs_videogames',
    category: 'needs_vs_wants',
    description: 'Get school supplies or buy video games',
    optionA: {
      label: 'School Supplies',
      icon: '📚',
      lane: 0,
      flowImpact: 14,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Video Games',
      icon: '🕹️',
      lane: 2,
      flowImpact: -10,
      fliqWeight: -1,
    },
  },

  needs_rainjacket_vs_sunglasses: {
    id: 'needs_rainjacket_vs_sunglasses',
    category: 'needs_vs_wants',
    description: 'Buy a rain jacket (practical need) or cool sunglasses (want)',
    optionA: {
      label: 'Rain Jacket',
      icon: '🧥',
      lane: 0,
      flowImpact: 12,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Sunglasses',
      icon: '🕶️',
      lane: 2,
      flowImpact: -6,
      fliqWeight: -1,
    },
  },

  needs_healthylunch_vs_junkfood: {
    id: 'needs_healthylunch_vs_junkfood',
    category: 'needs_vs_wants',
    description: 'Choose a healthy lunch or grab junk food',
    optionA: {
      label: 'Healthy Lunch',
      icon: '🥗',
      lane: 0,
      flowImpact: 13,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Junk Food',
      icon: '🍔',
      lane: 2,
      flowImpact: -7,
      fliqWeight: -1,
    },
  },

  // =============================================
  // === SHARING / GENEROSITY (4 decisions) ======
  // =============================================

  share_help_carry_books: {
    id: 'share_help_carry_books',
    category: 'sharing',
    description: 'Help a friend carry heavy books or keep running',
    optionA: {
      label: 'Help Friend',
      icon: '🤝',
      lane: 0,
      flowImpact: 20,
      fliqWeight: 3,
    },
    optionB: {
      label: 'Keep Running',
      icon: '🏃',
      lane: 2,
      flowImpact: 0,
      fliqWeight: -2,
    },
  },

  share_lemonade_profits: {
    id: 'share_lemonade_profits',
    category: 'sharing',
    description: 'Share lemonade stand profits with partner or keep it all',
    optionA: {
      label: 'Share Profits',
      icon: '🍋',
      lane: 0,
      flowImpact: 18,
      fliqWeight: 3,
    },
    optionB: {
      label: 'Keep It All',
      icon: '💰',
      lane: 2,
      flowImpact: 5,
      fliqWeight: -2,
    },
  },

  share_donate_garden: {
    id: 'share_donate_garden',
    category: 'sharing',
    description: 'Donate coins to community garden or walk past it',
    optionA: {
      label: 'Donate to Garden',
      icon: '🌻',
      lane: 0,
      flowImpact: 16,
      fliqWeight: 3,
    },
    optionB: {
      label: 'Walk Past',
      icon: '🚶',
      lane: 2,
      flowImpact: 0,
      fliqWeight: -1,
    },
  },

  share_help_elderly: {
    id: 'share_help_elderly',
    category: 'sharing',
    description: 'Help elderly neighbor carry bags or rush ahead',
    optionA: {
      label: 'Help Neighbor',
      icon: '👵',
      lane: 0,
      flowImpact: 22,
      fliqWeight: 3,
    },
    optionB: {
      label: 'Rush Ahead',
      icon: '💨',
      lane: 2,
      flowImpact: 2,
      fliqWeight: -2,
    },
  },

  // =============================================
  // === RISK ASSESSMENT (4 decisions) ===========
  // =============================================

  risk_darkalley_vs_safepath: {
    id: 'risk_darkalley_vs_safepath',
    category: 'risk_assessment',
    description: 'Take dark alley shortcut or safe longer path',
    optionA: {
      label: 'Dark Alley',
      icon: '🌑',
      lane: 0,
      flowImpact: -15,
      fliqWeight: -2,
      riskOutcome: { good: 0.3, goodReward: 30, badPenalty: -15 },
    },
    optionB: {
      label: 'Safe Path',
      icon: '🛤️',
      lane: 2,
      flowImpact: 10,
      fliqWeight: 1,
    },
  },

  risk_busystreet_vs_crosswalk: {
    id: 'risk_busystreet_vs_crosswalk',
    category: 'risk_assessment',
    description: 'Dash across busy street or use the crosswalk',
    optionA: {
      label: 'Dash Across',
      icon: '🚗',
      lane: 0,
      flowImpact: -18,
      fliqWeight: -2,
      riskOutcome: { good: 0.2, goodReward: 20, badPenalty: -20 },
    },
    optionB: {
      label: 'Use Crosswalk',
      icon: '🚦',
      lane: 2,
      flowImpact: 10,
      fliqWeight: 1,
    },
  },

  risk_climbwall_vs_stairs: {
    id: 'risk_climbwall_vs_stairs',
    category: 'risk_assessment',
    description: 'Climb wall shortcut or take the stairs',
    optionA: {
      label: 'Climb Wall',
      icon: '🧗',
      lane: 0,
      flowImpact: -12,
      fliqWeight: -1,
      riskOutcome: { good: 0.4, goodReward: 25, badPenalty: -12 },
    },
    optionB: {
      label: 'Take Stairs',
      icon: '🪜',
      lane: 2,
      flowImpact: 8,
      fliqWeight: 1,
    },
  },

  risk_construction_vs_goaround: {
    id: 'risk_construction_vs_goaround',
    category: 'risk_assessment',
    description: 'Rush through construction zone or go safely around',
    optionA: {
      label: 'Rush Through',
      icon: '🚧',
      lane: 0,
      flowImpact: -16,
      fliqWeight: -2,
      riskOutcome: { good: 0.25, goodReward: 28, badPenalty: -18 },
    },
    optionB: {
      label: 'Go Around',
      icon: '🔄',
      lane: 2,
      flowImpact: 8,
      fliqWeight: 1,
    },
  },

  // =============================================
  // === BUDGETING (4 decisions) =================
  // =============================================

  budget_onegood_vs_threecheap: {
    id: 'budget_onegood_vs_threecheap',
    category: 'budgeting',
    description: 'Buy one quality item or three cheap items that break',
    optionA: {
      label: 'One Quality Item',
      icon: '⭐',
      lane: 0,
      flowImpact: 15,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Three Cheap Things',
      icon: '🗑️',
      lane: 2,
      flowImpact: -8,
      fliqWeight: -1,
    },
  },

  budget_saveforbike_vs_buytoys: {
    id: 'budget_saveforbike_vs_buytoys',
    category: 'budgeting',
    description: 'Save up for a bike or spend it all on small toys now',
    optionA: {
      label: 'Save for Bike',
      icon: '🚲',
      lane: 0,
      flowImpact: 0,
      fliqWeight: 3,
      delayedReward: 28,
    },
    optionB: {
      label: 'Buy Small Toys',
      icon: '🎲',
      lane: 2,
      flowImpact: 4,
      fliqWeight: -1,
    },
  },

  budget_packlunch_vs_buylunch: {
    id: 'budget_packlunch_vs_buylunch',
    category: 'budgeting',
    description: 'Pack a lunch from home or buy expensive lunch out',
    optionA: {
      label: 'Pack Lunch',
      icon: '🥪',
      lane: 0,
      flowImpact: 14,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Buy Lunch',
      icon: '💸',
      lane: 2,
      flowImpact: -10,
      fliqWeight: -1,
    },
  },

  budget_usecoupon_vs_ignoresavings: {
    id: 'budget_usecoupon_vs_ignoresavings',
    category: 'budgeting',
    description: 'Use a coupon wisely or ignore the savings opportunity',
    optionA: {
      label: 'Use Coupon',
      icon: '🎫',
      lane: 0,
      flowImpact: 12,
      fliqWeight: 2,
    },
    optionB: {
      label: 'Ignore Savings',
      icon: '🤷',
      lane: 2,
      flowImpact: -5,
      fliqWeight: -1,
    },
  },
};

// Category metadata for display and grouping
export const CATEGORIES = {
  saving_vs_spending: {
    id: 'saving_vs_spending',
    label: 'Saving vs Spending',
    icon: '🐷',
    color: 0xf5c542,
  },
  delayed_gratification: {
    id: 'delayed_gratification',
    label: 'Delayed Gratification',
    icon: '⏳',
    color: 0x4ecdc4,
  },
  needs_vs_wants: {
    id: 'needs_vs_wants',
    label: 'Needs vs Wants',
    icon: '⚖️',
    color: 0x2ecc71,
  },
  sharing: {
    id: 'sharing',
    label: 'Sharing & Generosity',
    icon: '🤝',
    color: 0xff9f43,
  },
  risk_assessment: {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    icon: '⚡',
    color: 0xe74c3c,
  },
  budgeting: {
    id: 'budgeting',
    label: 'Budgeting',
    icon: '📊',
    color: 0x3498db,
  },
};

// Get all decisions for a specific category
export function getDecisionsByCategory(category) {
  return Object.values(DECISIONS).filter(d => d.category === category);
}

// Get a random decision from available pool, optionally filtering by category
export function getRandomDecision(usedIds = [], category = null) {
  let pool = Object.values(DECISIONS);
  if (category) {
    pool = pool.filter(d => d.category === category);
  }
  const available = pool.filter(d => !usedIds.includes(d.id));
  if (available.length === 0) {
    // Reset pool if all used - pick from full set
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// Get a balanced set of decisions across all categories
// Returns one decision per category, then fills remaining slots randomly
export function getBalancedDecisionSet(count = 6, usedIds = []) {
  const categories = Object.keys(CATEGORIES);
  const selected = [];
  const localUsed = [...usedIds];

  // First pass: one from each category
  for (const cat of categories) {
    if (selected.length >= count) break;
    const catDecisions = getDecisionsByCategory(cat).filter(
      d => !localUsed.includes(d.id)
    );
    if (catDecisions.length > 0) {
      const pick = catDecisions[Math.floor(Math.random() * catDecisions.length)];
      selected.push(pick);
      localUsed.push(pick.id);
    }
  }

  // Second pass: fill remaining slots from any category
  while (selected.length < count) {
    const remaining = Object.values(DECISIONS).filter(
      d => !localUsed.includes(d.id)
    );
    if (remaining.length === 0) break;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(pick);
    localUsed.push(pick.id);
  }

  // Shuffle the final set so categories aren't in predictable order
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }

  return selected;
}
