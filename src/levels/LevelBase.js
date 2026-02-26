// Base level class - manages entity spawning, collisions, and level flow
// Ported from Max the Flying Chicken LevelBase pattern, adapted for 3D runner

import { CONFIG } from '../config.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Coin } from '../entities/Coin.js';
import { FlowPickup } from '../entities/FlowPickup.js';
import { DrainPickup } from '../entities/DrainPickup.js';
import { DecisionFork } from '../entities/DecisionFork.js';
import { Collision } from '../engine/Collision.js';
import { getRandomDecision } from '../data/decisions.js';
import { randomRange, randomInt } from '../utils/math.js';

export class LevelBase {
  constructor(game, config) {
    this.game = game;
    this.config = config;

    // Entity arrays (same pattern as Max's LevelBase)
    this.obstacles = [];
    this.coins = [];
    this.flowPickups = [];
    this.drainPickups = [];
    this.decisionForks = [];

    // Spawn timers
    this.obstacleTimer = randomRange(...config.obstacleInterval);
    this.coinTimer = 0;
    this.decisionTimer = randomRange(...config.decisionInterval);
    this.usedDecisionIds = [];

    // Level state
    this.distance = 0;
    this.flowEarned = 0;
    this.coinsCollected = 0;
    this.decisionsPresented = 0;
    this.levelTime = 0;
    this.complete = false;
    this.activeDecision = null;

    // Set player speed for this level
    this.game.player.setSpeed(config.baseSpeed, config.maxSpeed);
  }

  update(dt, input) {
    if (this.complete) return;

    const player = this.game.player;
    this.levelTime += dt;
    this.distance += player.speed * dt;

    // Spawn entities
    this._updateSpawning(dt, player);

    // Update entities
    this._updateEntities(dt);

    // Check collisions
    this._checkCollisions(player);

    // Check level completion
    if (this.levelTime >= this.config.targetDuration &&
        this.decisionsPresented >= this.config.targetDecisions) {
      this.completeLevelGracefully();
    }
  }

  _updateSpawning(dt, player) {
    const spawnZ = player.z - 40; // Spawn ahead of player

    // Obstacles
    this.obstacleTimer -= dt;
    if (this.obstacleTimer <= 0) {
      this._spawnObstacle(spawnZ);
      this.obstacleTimer = randomRange(...this.config.obstacleInterval);
    }

    // Coins
    this.coinTimer -= dt;
    if (this.coinTimer <= 0) {
      this._spawnCoinGroup(spawnZ);
      this.coinTimer = 1.5;
    }

    // Decision points
    if (!this.activeDecision) {
      this.decisionTimer -= dt;
      if (this.decisionTimer <= 0 &&
          this.decisionsPresented < this.config.targetDecisions) {
        this._spawnDecision(spawnZ - 5);
        this.decisionTimer = randomRange(...this.config.decisionInterval);
      }
    }
  }

  _spawnObstacle(z) {
    const types = this.config.obstacles;
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = randomInt(0, 2);

    const obstacle = new Obstacle(type, lane, z);
    obstacle.addToScene(this.game.scene);
    this.obstacles.push(obstacle);
  }

  _spawnCoinGroup(z) {
    const lane = randomInt(0, 2);
    const count = randomInt(3, this.config.coinDensity);

    for (let i = 0; i < count; i++) {
      // Check if this should be a flow pickup instead
      if (Math.random() < this.config.flowPickupChance && i === Math.floor(count / 2)) {
        const types = ['piggybank', 'groceries', 'savingsjar', 'books'];
        const type = types[Math.floor(Math.random() * types.length)];
        const pickup = new FlowPickup(type, lane, z - i * 2, randomInt(10, 25));
        pickup.addToScene(this.game.scene);
        this.flowPickups.push(pickup);
        continue;
      }

      // Check for drain/temptation item
      if (Math.random() < this.config.drainPickupChance && i === 0) {
        const types = ['toy', 'candy', 'icecream', 'gamepad'];
        const type = types[Math.floor(Math.random() * types.length)];
        const drain = new DrainPickup(type, lane, z - i * 2, randomInt(-5, -15));
        drain.addToScene(this.game.scene);
        this.drainPickups.push(drain);
        continue;
      }

      const coin = new Coin(lane, z - i * 2);
      coin.addToScene(this.game.scene);
      this.coins.push(coin);
    }
  }

  _spawnDecision(z) {
    const categories = this.config.decisionCategories;
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Find a decision matching this category
    const allDecisions = getRandomDecision(this.config.id, this.usedDecisionIds);
    if (!allDecisions) return;

    const fork = new DecisionFork(allDecisions, z);
    fork.addToScene(this.game.scene);
    this.decisionForks.push(fork);
    this.activeDecision = fork;
    this.decisionsPresented++;
    this.usedDecisionIds.push(allDecisions.id);

    // Record decision appeared
    this.game.tracking.record({
      type: 'DECISION_ENTERED',
      decisionId: allDecisions.id,
      category: allDecisions.category,
      playerFlow: this.game.playerData.flow,
      level: this.config.id,
    });

    // Show decision UI
    fork.promptShownAt = Date.now();
    this.game.decisionUI.showDecision(allDecisions, (choice) => {
      this._resolveDecision(fork, choice);
    });
  }

  _resolveDecision(fork, uiChoice) {
    const player = this.game.player;
    const option = uiChoice === 'A' ? fork.decision.optionA : fork.decision.optionB;

    fork.choiceMade = uiChoice;
    fork.resolved = true;

    const responseTime = Date.now() - fork.promptShownAt;

    // Apply flow impact
    this.game.playerData.flow += option.flowImpact;
    this.flowEarned += option.flowImpact;

    // Track the decision
    this.game.tracking.record({
      type: 'DECISION_MADE',
      decisionId: fork.decision.id,
      category: fork.decision.category,
      choice: uiChoice,
      optionChosen: option,
      flowImpact: option.flowImpact,
      fliqDimension: option.fliqDimension,
      fliqWeight: option.fliqWeight,
      responseTimeMs: responseTime,
      playerFlow: this.game.playerData.flow,
      level: this.config.id,
    });

    // Visual feedback
    const isPositive = option.flowImpact > 0;
    this.game.hud.flashDecision(isPositive);
    this.game.audio.playSfx(isPositive ? 'good_decision' : 'bad_decision');

    // Particle burst at player position
    const color = isPositive ? 0x2ecc71 : 0xe74c3c;
    this.game.particles.burst(player.x, player.y + 1, player.z, color, 15, 4);

    // Hide decision UI
    this.game.decisionUI.hide();
    this.activeDecision = null;

    // Update city restoration
    this.game.lightingSystem.setFlow(this.game.playerData.flow);
  }

  _updateEntities(dt) {
    const player = this.game.player;
    const cullZ = player.z + 10; // Remove entities behind player

    // Update and cull obstacles
    this.obstacles = this.obstacles.filter(obs => {
      obs.update(dt);
      if (obs.z > cullZ) {
        obs.removeFromScene(this.game.scene);
        obs.dispose();
        return false;
      }
      return true;
    });

    // Update and cull coins
    this.coins = this.coins.filter(coin => {
      coin.update(dt);
      if (coin.collected || coin.z > cullZ) {
        coin.removeFromScene(this.game.scene);
        coin.dispose();
        return false;
      }
      return true;
    });

    // Update flow pickups
    this.flowPickups = this.flowPickups.filter(fp => {
      fp.update(dt);
      if (fp.collected || fp.z > cullZ) {
        fp.removeFromScene(this.game.scene);
        fp.dispose();
        return false;
      }
      return true;
    });

    // Update drain pickups
    this.drainPickups = this.drainPickups.filter(dp => {
      dp.update(dt);
      if (dp.collected || dp.z > cullZ) {
        dp.removeFromScene(this.game.scene);
        dp.dispose();
        return false;
      }
      return true;
    });

    // Update decision forks
    this.decisionForks.forEach(df => df.update(dt));

    // Auto-resolve decision if player runs past it
    if (this.activeDecision && player.z < this.activeDecision.z - this.activeDecision.depth) {
      if (!this.activeDecision.resolved) {
        // Player ran through - resolve based on lane
        const option = this.activeDecision.resolveChoice(player.lane);
        if (option) {
          this._resolveDecision(this.activeDecision,
            this.activeDecision.choiceMade === 'A' ? 'A' : 'B');
        } else {
          // Skipped entirely
          this.game.tracking.record({
            type: 'DECISION_SKIPPED',
            decisionId: this.activeDecision.decision.id,
            category: this.activeDecision.decision.category,
            level: this.config.id,
          });
          this.game.decisionUI.hide();
          this.activeDecision = null;
        }
      }
    }
  }

  _checkCollisions(player) {
    // Coins
    this.coins.forEach(coin => {
      if (!coin.collected && Collision.checkProximity(player, coin, coin.collectRadius)) {
        coin.collect();
        this.game.playerData.flow += coin.value;
        this.game.playerData.coins++;
        this.coinsCollected++;
        this.flowEarned += coin.value;
        this.game.hud.setCoins(this.game.playerData.coins);
        this.game.audio.playSfx('coin');
        this.game.particles.burst(coin.x, coin.y, coin.z, 0xffd700, 6, 2);

        this.game.tracking.record({
          type: 'COIN_COLLECTED',
          value: coin.value,
          playerFlow: this.game.playerData.flow,
        });
      }
    });

    // Flow pickups
    this.flowPickups.forEach(fp => {
      if (!fp.collected && Collision.checkProximity(player, fp, fp.collectRadius)) {
        fp.collect();
        this.game.playerData.flow += fp.value;
        this.flowEarned += fp.value;
        this.game.audio.playSfx('flow_pickup');
        this.game.particles.burst(fp.x, fp.y, fp.z, 0xf5c542, 15, 4);

        this.game.tracking.record({
          type: 'FLOW_COLLECTED',
          pickupType: fp.pickupType,
          value: fp.value,
          playerFlow: this.game.playerData.flow,
        });
      }
    });

    // Drain pickups (player chose to grab temptation)
    this.drainPickups.forEach(dp => {
      if (!dp.collected && Collision.checkProximity(player, dp, dp.collectRadius)) {
        dp.collect();
        this.game.playerData.flow += dp.value; // Negative
        this.flowEarned += dp.value;
        this.game.audio.playSfx('bad_decision');
        this.game.particles.burst(dp.x, dp.y, dp.z, 0xe74c3c, 8, 2);

        this.game.tracking.record({
          type: 'DRAIN_COLLECTED',
          pickupType: dp.pickupType,
          value: dp.value,
          playerFlow: this.game.playerData.flow,
        });
      }
    });

    // Obstacles
    this.obstacles.forEach(obs => {
      if (Collision.checkLaneCollision(player, obs)) {
        // Can jump over?
        if (obs.canJumpOver && player.y > 0.5) return;
        // Can slide under?
        if (obs.canSlideUnder && player.isSliding) return;

        // Hit!
        if (player.hit()) {
          this.game.playerData.flow += CONFIG.flow.obstacleHit;
          this.flowEarned += CONFIG.flow.obstacleHit;
          this.game.audio.playSfx('obstacle_hit');
          this.game.sessionRecorder.addObstacleHit();

          this.game.tracking.record({
            type: 'OBSTACLE_HIT',
            obstacleType: obs.type,
            flowImpact: CONFIG.flow.obstacleHit,
            playerFlow: this.game.playerData.flow,
          });
        }
      }
    });

    // Update HUD
    this.game.hud.setFlow(this.game.playerData.flow);
    this.game.lightingSystem.setFlow(this.game.playerData.flow);
  }

  completeLevelGracefully() {
    if (this.complete) return;
    this.complete = true;

    // Level complete bonus
    this.game.playerData.flow += CONFIG.flow.levelComplete;
    this.flowEarned += CONFIG.flow.levelComplete;

    this.game.audio.playSfx('level_complete');

    // Record
    this.game.sessionRecorder.recordLevelComplete(
      this.config.id,
      this.flowEarned,
      this.coinsCollected,
      this.levelTime * 1000
    );

    this.game.tracking.record({
      type: 'LEVEL_COMPLETE',
      level: this.config.id,
      flowEarned: this.flowEarned,
      coinsCollected: this.coinsCollected,
      decisionsPresented: this.decisionsPresented,
      duration: this.levelTime,
    });
  }

  dispose() {
    [...this.obstacles, ...this.coins, ...this.flowPickups, ...this.drainPickups, ...this.decisionForks]
      .forEach(entity => {
        entity.removeFromScene(this.game.scene);
        entity.dispose();
      });
  }
}
