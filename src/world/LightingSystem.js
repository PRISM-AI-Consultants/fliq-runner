// Dynamic lighting system for city restoration
// Controls the dark-to-bright transition as player earns Flow
// This drives the emotional arc: dark/cold/quiet -> bright/warm/alive
import * as THREE from 'three';
import { getCityStage, getRestorationPercent } from '../data/flowEconomy.js';
import { lerp } from '../utils/math.js';

// Fog color endpoints
const FOG_COLOR_COLD = new THREE.Color(0x2d1b3e);   // cool purple (low restoration)
const FOG_COLOR_WARM = new THREE.Color(0x4a3530);    // warm gold-tinted (high restoration)

// Ambient light color endpoints
const AMBIENT_COLOR_COLD = new THREE.Color(0xb0a0c0); // cool lavender (low restoration)
const AMBIENT_COLOR_WARM = new THREE.Color(0xf5d4a0); // warm golden (high restoration)

export class LightingSystem {
  constructor(sceneManager, skyGenerator, cityGenerator, renderer) {
    this.sceneManager = sceneManager;
    this.skyGenerator = skyGenerator;
    this.cityGenerator = cityGenerator;
    this.renderer = renderer || null; // Renderer reference for bloom control
    this.currentFlow = 0;
    this.currentStage = null;
    this.targetRestoration = 0;
    this.smoothRestoration = 0;
  }

  // Called when flow changes
  setFlow(flow) {
    this.currentFlow = flow;
    const stage = getCityStage(flow);
    this.targetRestoration = getRestorationPercent(flow);

    if (stage !== this.currentStage) {
      this.currentStage = stage;
      this.sceneManager.setCityStage(stage);
    }
  }

  update(dt) {
    // Smoothly interpolate restoration level
    this.smoothRestoration = lerp(this.smoothRestoration, this.targetRestoration, 2 * dt);
    const r = this.smoothRestoration;

    // Update sky brightness
    this.skyGenerator.setIntensity(r);

    // Update city materials, streetlights, windows, awnings
    this.cityGenerator.setRestorationLevel(r);

    // --- Bloom intensity scales with restoration ---
    // Low restoration = subtle bloom, high restoration = warm glow everywhere
    if (this.renderer && this.renderer.setBloomIntensity) {
      this.renderer.setBloomIntensity(r);
    }

    // --- Fog color shift: cool purple -> warm gold-tinted ---
    if (this.sceneManager.scene && this.sceneManager.scene.fog) {
      this.sceneManager.scene.fog.color.copy(FOG_COLOR_COLD).lerp(FOG_COLOR_WARM, r);
    }

    // --- Ambient light color shift: cool lavender -> warm golden ---
    if (this.sceneManager.ambientLight) {
      this.sceneManager.ambientLight.color.copy(AMBIENT_COLOR_COLD).lerp(AMBIENT_COLOR_WARM, r);
    }
  }
}
