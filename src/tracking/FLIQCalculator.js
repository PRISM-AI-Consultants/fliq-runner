// FLIQ Score Calculator - 6-dimension behavioral profile
// Score range: 0-100, NO child "fails"
// Every profile gets positive framing

import { FLIQ_DIMENSIONS, getResponseCategory } from '../data/fliqWeights.js';
import { clamp } from '../utils/math.js';

export class FLIQCalculator {
  calculate(decisionTracker, sessionRecorder) {
    const decisions = decisionTracker.getAll();
    const dimensions = {};

    // 1. Save Rate (20%)
    dimensions.saveRate = this._calcSaveRate(decisions);

    // 2. Delay Tolerance (20%)
    dimensions.delayTolerance = this._calcDelayTolerance(decisions);

    // 3. Needs vs Wants (15%)
    dimensions.needsVsWants = this._calcNeedsVsWants(decisions);

    // 4. Generosity (15%)
    dimensions.generosity = this._calcGenerosity(decisions);

    // 5. Risk Calibration (15%)
    dimensions.riskCalibration = this._calcRiskCalibration(decisions);

    // 6. Budget Adherence (15%)
    dimensions.budgetAdherence = this._calcBudgetAdherence(decisions);

    // Weighted total
    let total = 0;
    for (const [key, config] of Object.entries(FLIQ_DIMENSIONS)) {
      total += (dimensions[key] || 50) * config.weight;
    }

    // Consistency bonus (up to +5): players who improve score higher
    const consistencyBonus = this._calcConsistency(decisions);
    total = clamp(total + consistencyBonus, 0, 100);

    // Deliberation quality bonus (up to +5): thoughtful timing
    const deliberationBonus = this._calcDeliberationBonus(decisions);
    total = clamp(total + deliberationBonus, 0, 100);

    return {
      total: Math.round(total),
      dimensions,
      insights: this._generateInsights(dimensions),
    };
  }

  _calcSaveRate(decisions) {
    const relevant = decisions.filter(d =>
      d.category === 'saving_vs_spending' && d.choice !== 'SKIPPED'
    );
    if (relevant.length === 0) return 50;
    const positiveRatio = relevant.filter(d => d.fliqWeight > 0).length / relevant.length;
    return clamp(positiveRatio * 100, 0, 100);
  }

  _calcDelayTolerance(decisions) {
    const relevant = decisions.filter(d =>
      d.category === 'delayed_gratification' && d.choice !== 'SKIPPED'
    );
    if (relevant.length === 0) return 50;
    const positiveRatio = relevant.filter(d => d.fliqWeight > 0).length / relevant.length;
    return clamp(positiveRatio * 100, 0, 100);
  }

  _calcNeedsVsWants(decisions) {
    const relevant = decisions.filter(d =>
      d.category === 'needs_vs_wants' && d.choice !== 'SKIPPED'
    );
    if (relevant.length === 0) return 50;
    const positiveRatio = relevant.filter(d => d.fliqWeight > 0).length / relevant.length;
    return clamp(positiveRatio * 100, 0, 100);
  }

  _calcGenerosity(decisions) {
    const relevant = decisions.filter(d =>
      d.category === 'sharing' && d.choice !== 'SKIPPED'
    );
    if (relevant.length === 0) return 50;

    // Factor in skipped sharing opportunities (ignoring NPC = lower score)
    const skipped = decisions.filter(d =>
      d.category === 'sharing' && d.choice === 'SKIPPED'
    );
    const totalOpportunities = relevant.length + skipped.length;
    const positive = relevant.filter(d => d.fliqWeight > 0).length;
    return clamp((positive / Math.max(totalOpportunities, 1)) * 100, 0, 100);
  }

  _calcRiskCalibration(decisions) {
    const relevant = decisions.filter(d =>
      d.category === 'risk_assessment' && d.choice !== 'SKIPPED'
    );
    if (relevant.length === 0) return 50;

    // Risk calibration rewards balanced approach - not all safe, not all risky
    const safeChoices = relevant.filter(d => d.fliqWeight > 0).length;
    const ratio = safeChoices / relevant.length;
    // Ideal ratio is ~0.6 safe / 0.4 risky (some risk-taking is good)
    const idealDeviation = Math.abs(ratio - 0.6);
    return clamp((1 - idealDeviation * 2) * 100, 20, 100);
  }

  _calcBudgetAdherence(decisions) {
    const relevant = decisions.filter(d =>
      d.category === 'budgeting' && d.choice !== 'SKIPPED'
    );
    if (relevant.length === 0) return 50;
    const positiveRatio = relevant.filter(d => d.fliqWeight > 0).length / relevant.length;
    return clamp(positiveRatio * 100, 0, 100);
  }

  // Consistency bonus: later decisions improving = +5 max
  _calcConsistency(decisions) {
    if (decisions.length < 4) return 0;
    const half = Math.floor(decisions.length / 2);
    const firstHalf = decisions.slice(0, half);
    const secondHalf = decisions.slice(half);

    const firstPositive = firstHalf.filter(d => d.fliqWeight > 0).length / firstHalf.length;
    const secondPositive = secondHalf.filter(d => d.fliqWeight > 0).length / secondHalf.length;

    // Improving = bonus
    if (secondPositive > firstPositive) return 5;
    return 0;
  }

  // Deliberation bonus: thoughtful timing = +5 max
  _calcDeliberationBonus(decisions) {
    const timed = decisions.filter(d => d.responseTimeMs > 0);
    if (timed.length === 0) return 0;

    const deliberateCount = timed.filter(d =>
      getResponseCategory(d.responseTimeMs) === 'deliberate'
    ).length;

    const ratio = deliberateCount / timed.length;
    return ratio * 5;
  }

  _generateInsights(dimensions) {
    const insights = [];
    const sorted = Object.entries(dimensions).sort((a, b) => b[1] - a[1]);

    // Highlight strongest dimension
    const [strongKey, strongScore] = sorted[0];
    const strongDim = FLIQ_DIMENSIONS[strongKey];
    if (strongScore >= 60) {
      insights.push({
        type: 'strength',
        dimension: strongKey,
        message: strongDim.positiveTitle,
      });
    }

    // Encourage on weakest dimension (never negative framing)
    const [weakKey, weakScore] = sorted[sorted.length - 1];
    const weakDim = FLIQ_DIMENSIONS[weakKey];
    if (weakScore < 50) {
      insights.push({
        type: 'growth',
        dimension: weakKey,
        message: weakDim.encouragement,
      });
    }

    return insights;
  }
}
