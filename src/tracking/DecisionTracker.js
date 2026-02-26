// Tracks decision-specific data for FLIQ scoring
// Records: choice, timing, category, flow impact, patterns

export class DecisionTracker {
  constructor(trackingEngine) {
    this.engine = trackingEngine;
    this.decisions = [];
    this.pendingDecision = null;

    // Listen for decision events
    this.engine.on('DECISION_ENTERED', (e) => this._onEntered(e));
    this.engine.on('DECISION_MADE', (e) => this._onMade(e));
    this.engine.on('DECISION_SKIPPED', (e) => this._onSkipped(e));
  }

  _onEntered(event) {
    this.pendingDecision = {
      decisionId: event.decisionId,
      category: event.category,
      enteredAt: event.timestamp,
      playerFlow: event.playerFlow,
    };
  }

  _onMade(event) {
    const decision = {
      decisionId: event.decisionId,
      category: event.category,
      choice: event.choice,               // 'A' or 'B'
      optionChosen: event.optionChosen,    // Full option data
      flowImpact: event.flowImpact,
      fliqDimension: event.fliqDimension,
      fliqWeight: event.fliqWeight,
      responseTimeMs: event.responseTimeMs,
      playerFlowAtDecision: event.playerFlow,
      level: event.level,
    };
    this.decisions.push(decision);
    this.pendingDecision = null;
  }

  _onSkipped(event) {
    this.decisions.push({
      decisionId: event.decisionId,
      category: event.category,
      choice: 'SKIPPED',
      flowImpact: 0,
      responseTimeMs: 0,
      level: event.level,
    });
    this.pendingDecision = null;
  }

  // Get decisions by category
  getByCategory(category) {
    return this.decisions.filter(d => d.category === category);
  }

  // Get average response time
  getAvgResponseTime() {
    const timed = this.decisions.filter(d => d.responseTimeMs > 0);
    if (timed.length === 0) return 0;
    return timed.reduce((sum, d) => sum + d.responseTimeMs, 0) / timed.length;
  }

  // Get positive choice ratio for a dimension
  getPositiveRatio(dimension) {
    const relevant = this.decisions.filter(d => d.fliqDimension === dimension);
    if (relevant.length === 0) return 0.5; // Neutral if no data
    const positive = relevant.filter(d => d.fliqWeight > 0);
    return positive.length / relevant.length;
  }

  // Get all decisions for export
  getAll() {
    return [...this.decisions];
  }

  reset() {
    this.decisions = [];
    this.pendingDecision = null;
  }
}
