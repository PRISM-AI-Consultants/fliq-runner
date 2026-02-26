// Master game class - orchestrates the entire game loop
// Fixed-timestep pattern ported from Max the Flying Chicken Game.js
// State machine: TITLE -> CHARACTER_SELECT -> PLAYING -> LEVEL_TRANSITION -> SCORE

import { CONFIG } from '../config.js';
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { Camera } from './Camera.js';
import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Player } from '../entities/Player.js';
import { Particle3D } from '../entities/Particle3D.js';
import { GroundGenerator } from '../world/GroundGenerator.js';
import { CityGenerator } from '../world/CityGenerator.js';
import { SkyGenerator } from '../world/SkyGenerator.js';
import { LightingSystem } from '../world/LightingSystem.js';
import { HUD } from '../ui/HUD.js';
import { DecisionUI } from '../ui/DecisionUI.js';
import { TitleScreen } from '../ui/TitleScreen.js';
import { CharacterSelect } from '../ui/CharacterSelect.js';
import { FLIQScoreScreen } from '../ui/FLIQScoreScreen.js';
import { LevelTransition } from '../ui/LevelTransition.js';
import { TrackingEngine } from '../tracking/TrackingEngine.js';
import { DecisionTracker } from '../tracking/DecisionTracker.js';
import { SessionRecorder } from '../tracking/SessionRecorder.js';
import { FLIQCalculator } from '../tracking/FLIQCalculator.js';
import { LevelFactory } from '../levels/LevelFactory.js';
import { updateFPS, getFPS, createDebugPanel, updateDebugPanel } from '../utils/debug.js';

export class Game {
  constructor(canvas) {
    // Renderer
    this.renderer = new Renderer(canvas);

    // Scene
    this.sceneManager = new SceneManager();
    this.scene = this.sceneManager.scene;

    // Camera
    this.cameraController = new Camera();
    this.camera = this.cameraController.camera;

    // Post-processing
    this.renderer.setupPostProcessing(this.scene, this.camera);

    // Input
    this.input = new Input();

    // Audio
    this.audio = new Audio();

    // World generators
    this.groundGenerator = new GroundGenerator(this.scene);
    this.cityGenerator = new CityGenerator(this.scene);
    this.skyGenerator = new SkyGenerator(this.scene);

    // Lighting system
    this.lightingSystem = new LightingSystem(
      this.sceneManager, this.skyGenerator, this.cityGenerator
    );

    // Particles
    this.particles = new Particle3D(this.scene);

    // Player (will be created on character select)
    this.player = null;

    // Tracking
    this.tracking = new TrackingEngine();
    this.decisionTracker = new DecisionTracker(this.tracking);
    this.sessionRecorder = new SessionRecorder(this.tracking, this.decisionTracker);
    this.fliqCalculator = new FLIQCalculator();

    // Player data (persists across levels)
    this.playerData = {
      flow: 0,
      coins: 0,
      characterId: 'miller',
    };

    // UI
    const overlay = document.getElementById('ui-overlay');
    this.hud = new HUD(overlay);
    this.decisionUI = new DecisionUI(overlay);
    this.titleScreen = new TitleScreen(overlay, () => this.onTitleStart());
    this.characterSelect = new CharacterSelect(overlay, (id) => this.onCharacterSelected(id));
    this.scoreScreen = new FLIQScoreScreen(overlay, () => this.onPlayAgain());
    this.levelTransition = new LevelTransition(overlay);

    // Level
    this.currentLevel = null;
    this.currentLevelIndex = 0;

    // Game state
    this.state = 'LOADING'; // LOADING, TITLE, CHARACTER_SELECT, PLAYING, LEVEL_TRANSITION, SCORE
    this.fadeAlpha = 0;
    this.fadeDirection = 0;
    this.fadeSpeed = 2.5;
    this.fadeCallback = null;

    // Game loop (fixed timestep from Max)
    this.TICK_RATE = 1000 / 60;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;

    // Debug
    this.debugPanel = createDebugPanel();

    // Hide loading, show title
    this._hideLoading();
  }

  _hideLoading() {
    const loading = document.getElementById('loading-screen');
    if (loading) {
      // Quick progress animation
      const bar = document.getElementById('loading-bar');
      if (bar) bar.style.width = '100%';
      setTimeout(() => {
        loading.classList.add('hidden');
        this.state = 'TITLE';
        this.titleScreen.show();
        this.start();
      }, 500);
    } else {
      this.state = 'TITLE';
      this.titleScreen.show();
      this.start();
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime) {
    if (!this.running) return;

    const deltaTime = Math.min(currentTime - this.lastTime, 100);
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.TICK_RATE) {
      this.input.update();
      this.update(this.TICK_RATE / 1000);
      this.accumulator -= this.TICK_RATE;
    }

    // Render
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Update fade
    if (this.fadeDirection !== 0) {
      this.fadeAlpha += this.fadeDirection * this.fadeSpeed * dt;
      if (this.fadeAlpha >= 1 && this.fadeDirection === 1) {
        this.fadeAlpha = 1;
        this.fadeDirection = -1;
        if (this.fadeCallback) {
          this.fadeCallback();
          this.fadeCallback = null;
        }
      } else if (this.fadeAlpha <= 0 && this.fadeDirection === -1) {
        this.fadeAlpha = 0;
        this.fadeDirection = 0;
      }
    }

    // Tracking tick
    this.tracking.tick();

    // FPS
    updateFPS(dt);

    switch (this.state) {
      case 'TITLE':
        // Animate sky in background
        this.skyGenerator.update(this.cameraController.camera.position);
        break;

      case 'CHARACTER_SELECT':
        this.skyGenerator.update(this.cameraController.camera.position);
        break;

      case 'PLAYING':
        if (this.player && this.currentLevel) {
          // Update player
          this.player.update(dt, this.input);

          // Update level (spawning, collisions)
          this.currentLevel.update(dt, this.input);

          // Update world generators
          this.groundGenerator.update(this.player.z);
          this.cityGenerator.update(this.player.z);

          // Camera follow
          this.cameraController.follow(this.player.x, this.player.y, this.player.z, dt);

          // Scene lighting
          this.sceneManager.update(dt);
          this.sceneManager.updateShadowTarget(this.player.z);

          // Sky follows camera
          this.skyGenerator.update(this.camera.position);

          // Lighting system
          this.lightingSystem.update(dt);

          // Particles
          this.particles.update(dt);

          // Player shoe trail particles
          if (this.player.onGround && !this.player.isSliding) {
            if (Math.random() > 0.7) {
              this.particles.trail(
                this.player.x, 0.05, this.player.z,
                this.player.characterData.shoeColor
              );
            }
          }

          // HUD updates
          this.hud.setFlow(this.playerData.flow);
          this.hud.setRestoration(this.playerData.flow / 750);

          // Check level complete
          if (this.currentLevel.complete) {
            this._onLevelComplete();
          }
        }
        break;

      case 'LEVEL_TRANSITION':
        break;

      case 'SCORE':
        break;
    }

    // Debug
    if (this.debugPanel && CONFIG.debugMode) {
      updateDebugPanel(this.debugPanel, {
        FPS: getFPS(),
        State: this.state,
        Flow: Math.floor(this.playerData.flow),
        Level: this.currentLevelIndex + 1,
        Z: this.player ? Math.floor(-this.player.z) : 0,
      });
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // === State Transitions ===

  onTitleStart() {
    this.audio.init(); // Must init from user gesture
    this.audio.playSfx('ui_select');
    this.titleScreen.hide();
    this.state = 'CHARACTER_SELECT';
    this.characterSelect.show();
  }

  onCharacterSelected(characterId) {
    this.audio.playSfx('ui_select');
    this.playerData.characterId = characterId;
    this.characterSelect.hide();

    // Create player
    this.player = new Player(characterId);
    this.player.addToScene(this.scene);

    // Reset tracking
    this.tracking.reset();
    this.decisionTracker.reset();
    this.sessionRecorder.reset();
    this.sessionRecorder.setPlayer(null, characterId);

    // Reset player data
    this.playerData.flow = 0;
    this.playerData.coins = 0;

    // Snap camera
    this.cameraController.snapTo(0, 0, 0);

    // Start level 1
    this.currentLevelIndex = 0;
    this._startLevel(0);
  }

  _startLevel(index) {
    this.currentLevelIndex = index;

    // Clean up previous level
    if (this.currentLevel) {
      this.currentLevel.dispose();
    }

    // Create new level
    this.currentLevel = LevelFactory.createLevel(this, index);

    // Reset player position
    this.player.reset();
    this.cameraController.snapTo(0, 0, 0);

    // Show HUD
    this.hud.show();
    this.hud.displayLevelName(
      LevelFactory.getLevelName(index),
      LevelFactory.getLevelDescription(index)
    );

    // Set lighting for level start
    this.lightingSystem.setFlow(this.playerData.flow);

    this.state = 'PLAYING';

    this.tracking.record({
      type: 'LEVEL_START',
      level: index + 1,
      playerFlow: this.playerData.flow,
    });
  }

  _onLevelComplete() {
    this.hud.hide();

    const nextIndex = this.currentLevelIndex + 1;
    const isLastLevel = nextIndex >= LevelFactory.getTotalLevels();

    if (isLastLevel) {
      // Show FLIQ score
      this._showFLIQScore();
    } else {
      // Show transition screen
      this.state = 'LEVEL_TRANSITION';
      const narrative = this._getLevelNarrative(this.currentLevelIndex);
      this.levelTransition.showTransition(
        this.currentLevelIndex + 1,
        narrative,
        Math.floor(this.currentLevel.flowEarned),
        () => {
          this.levelTransition.hide();
          this._startLevel(nextIndex);
        }
      );
    }
  }

  _showFLIQScore() {
    this.state = 'SCORE';

    // Calculate FLIQ score
    const fliqResult = this.fliqCalculator.calculate(
      this.decisionTracker,
      this.sessionRecorder
    );

    // Log final session data
    const sessionData = this.sessionRecorder.export();
    console.log('FLIQ Session Data:', JSON.stringify(sessionData, null, 2));
    console.log('FLIQ Score:', fliqResult);

    // Store in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('fliq_sessions') || '[]');
      stored.push({
        ...sessionData,
        fliqScore: fliqResult,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('fliq_sessions', JSON.stringify(stored));
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }

    // Show score screen
    this.scoreScreen.showScore(fliqResult);
    this.audio.playSfx('level_complete');
  }

  onPlayAgain() {
    this.scoreScreen.hide();

    // Clean up
    if (this.currentLevel) {
      this.currentLevel.dispose();
      this.currentLevel = null;
    }
    if (this.player) {
      this.player.removeFromScene(this.scene);
      this.player = null;
    }

    // Clean up world
    this.groundGenerator.dispose();
    this.cityGenerator.dispose();

    // Back to title
    this.state = 'TITLE';
    this.titleScreen.show();
  }

  _getLevelNarrative(levelIndex) {
    const narratives = [
      'The first lights flicker on! Your choices are bringing energy back to Velo City. The streets are waking up...',
      'More of the city is coming alive! Storefronts glow with warm light. Your smart decisions are making a difference!',
      'Velo City shines bright! Every choice you made helped restore the Flow. The city was waiting for someone like you!',
    ];
    return narratives[levelIndex] || narratives[narratives.length - 1];
  }

  fadeTransition(callback) {
    this.fadeDirection = 1;
    this.fadeAlpha = 0;
    this.fadeCallback = callback;
  }
}
