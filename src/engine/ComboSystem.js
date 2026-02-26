/**
 * ComboSystem.js - Streak and multiplier system for FLIQ Runner
 *
 * Rewards sustained good play (collecting coins, correct decisions, flow pickups)
 * with escalating score multipliers and visual feedback labels.
 *
 * Combo breaks on: bad actions (obstacle hits, wrong decisions, drain pickups)
 * or inactivity (no good actions within the comboTimeout window).
 */

export class ComboSystem {
  constructor() {
    this.streak = 0;
    this.multiplier = 1;
    this.maxStreak = 0;
    this.comboTimer = 0;
    this.comboTimeout = 4; // seconds of inactivity before combo resets

    this.streakThresholds = [
      { count: 0, multiplier: 1, label: '' },
      { count: 3, multiplier: 1.5, label: 'Nice!' },
      { count: 6, multiplier: 2, label: 'Great!' },
      { count: 10, multiplier: 2.5, label: 'Amazing!' },
      { count: 15, multiplier: 3, label: 'UNSTOPPABLE!' },
    ];

    this.lastThresholdIndex = 0;

    // Callbacks - assign externally
    this.onMultiplierChange = null; // (multiplier, label) => {}
    this.onComboBreak = null;       // () => {}
  }

  /**
   * Called when the player does something good
   * (coin collected, correct decision, flow pickup, etc.)
   */
  addGood() {
    this.streak += 1;

    // Track best streak for end-of-session stats
    if (this.streak > this.maxStreak) {
      this.maxStreak = this.streak;
    }

    // Reset the inactivity timer
    this.comboTimer = this.comboTimeout;

    // Determine which threshold we are at now
    const newThresholdIndex = this._getThresholdIndex(this.streak);

    if (newThresholdIndex !== this.lastThresholdIndex) {
      this.lastThresholdIndex = newThresholdIndex;
      const threshold = this.streakThresholds[newThresholdIndex];
      this.multiplier = threshold.multiplier;

      if (this.onMultiplierChange) {
        this.onMultiplierChange(this.multiplier, threshold.label);
      }
    }
  }

  /**
   * Called when the player does something bad
   * (obstacle hit, wrong decision, drain pickup, etc.)
   */
  addBad() {
    if (this.streak > 0) {
      this._breakCombo();
    }
  }

  /**
   * Returns the current score multiplier.
   * @returns {number}
   */
  getMultiplier() {
    return this.multiplier;
  }

  /**
   * Returns the current streak count.
   * @returns {number}
   */
  getStreak() {
    return this.streak;
  }

  /**
   * Returns the combo timer as a ratio from 1.0 (full) to 0.0 (about to break).
   * Returns 0 if no active combo.
   * @returns {number}
   */
  getTimerRatio() {
    if (this.streak === 0 || this.comboTimeout === 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, this.comboTimer / this.comboTimeout));
  }

  /**
   * Tick the combo timer each frame. If the timer expires, break the combo.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.streak === 0) {
      return;
    }

    this.comboTimer -= dt;

    if (this.comboTimer <= 0) {
      this.comboTimer = 0;
      this._breakCombo();
    }
  }

  /**
   * Reset all combo state for a new session.
   */
  reset() {
    this.streak = 0;
    this.multiplier = 1;
    this.maxStreak = 0;
    this.comboTimer = 0;
    this.lastThresholdIndex = 0;
  }

  // --- Private helpers ---

  /**
   * Find the highest threshold index the given streak qualifies for.
   * @param {number} streak
   * @returns {number}
   */
  _getThresholdIndex(streak) {
    let index = 0;
    for (let i = this.streakThresholds.length - 1; i >= 0; i--) {
      if (streak >= this.streakThresholds[i].count) {
        index = i;
        break;
      }
    }
    return index;
  }

  /**
   * Break the current combo, resetting streak and multiplier.
   * Fires the onComboBreak callback.
   */
  _breakCombo() {
    this.streak = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    this.lastThresholdIndex = 0;

    if (this.onComboBreak) {
      this.onComboBreak();
    }
  }
}
