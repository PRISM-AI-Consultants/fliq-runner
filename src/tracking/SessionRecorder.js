// Aggregates all tracking data into a complete session record
// Exports as JSON for potential backend submission

import { uid } from '../utils/math.js';

export class SessionRecorder {
  constructor(trackingEngine, decisionTracker) {
    this.engine = trackingEngine;
    this.decisionTracker = decisionTracker;

    this.sessionId = uid();
    this.playerId = null;
    this.characterId = null;
    this.levelsCompleted = [];
    this.totalFlow = 0;
    this.totalCoins = 0;
    this.obstacleHits = 0;
    this.startTime = Date.now();
  }

  setPlayer(playerId, characterId) {
    this.playerId = playerId;
    this.characterId = characterId;
  }

  recordLevelComplete(levelNum, flow, coins, duration) {
    this.levelsCompleted.push({
      level: levelNum,
      flowEarned: flow,
      coinsCollected: coins,
      durationMs: duration,
      completedAt: Date.now(),
    });
  }

  addFlow(amount) {
    this.totalFlow += amount;
  }

  addCoins(count) {
    this.totalCoins += count;
  }

  addObstacleHit() {
    this.obstacleHits++;
  }

  // Full session export matching Dr. Mike's spec format
  export() {
    return {
      session_id: this.sessionId,
      player_id: this.playerId || 'anonymous',
      character_id: this.characterId,
      timestamp: new Date(this.startTime).toISOString(),
      duration_ms: Date.now() - this.startTime,
      levels_completed: this.levelsCompleted,
      total_flow: this.totalFlow,
      total_coins: this.totalCoins,
      obstacle_hits: this.obstacleHits,
      decisions: this.decisionTracker.getAll().map(d => ({
        decision_id: d.decisionId,
        category: d.category,
        choice: d.choice,
        response_time_ms: d.responseTimeMs,
        flow_impact: d.flowImpact,
        level: d.level,
      })),
      raw_events: this.engine.export(),
    };
  }

  reset() {
    this.sessionId = uid();
    this.playerId = null;
    this.characterId = null;
    this.levelsCompleted = [];
    this.totalFlow = 0;
    this.totalCoins = 0;
    this.obstacleHits = 0;
    this.startTime = Date.now();
  }
}
