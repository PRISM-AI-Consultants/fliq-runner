// Dynamic lighting system for city restoration
// Controls the dark-to-bright transition as player earns Flow
import { getCityStage, getRestorationPercent } from '../data/flowEconomy.js';
import { lerp } from '../utils/math.js';

export class LightingSystem {
  constructor(sceneManager, skyGenerator, cityGenerator) {
    this.sceneManager = sceneManager;
    this.skyGenerator = skyGenerator;
    this.cityGenerator = cityGenerator;
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

    // Update sky brightness
    this.skyGenerator.setIntensity(this.smoothRestoration);

    // Update streetlights and building windows
    this.cityGenerator.setRestorationLevel(this.smoothRestoration);
  }
}
