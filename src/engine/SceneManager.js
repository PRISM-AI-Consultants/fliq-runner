// Scene management - lighting, fog, golden hour atmosphere
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { PALETTE } from '../utils/colors.js';
import { lerp } from '../utils/math.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();

    // Fog for depth (warm tint - light fog, not obscuring)
    this.scene.fog = new THREE.FogExp2(0x2d1b3e, 0.012);

    // Ambient light (visible from the start - dusk, not pitch black)
    this.ambientLight = new THREE.AmbientLight(0xf5d4a0, 0.5);
    this.scene.add(this.ambientLight);

    // Directional "sun" light - golden hour angle
    this.sunLight = new THREE.DirectionalLight(PALETTE.sunLight, 0.6);
    this.sunLight.position.set(-20, 15, -10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.camera.left = -15;
    this.sunLight.shadow.camera.right = 15;
    this.sunLight.shadow.camera.top = 15;
    this.sunLight.shadow.camera.bottom = -15;
    this.scene.add(this.sunLight);

    // Warm fill light from opposite side
    this.fillLight = new THREE.DirectionalLight(0xf5a060, 0.3);
    this.fillLight.position.set(10, 8, 5);
    this.scene.add(this.fillLight);

    // Hemisphere light for sky/ground color bleed (warm top, cool bottom)
    this.hemiLight = new THREE.HemisphereLight(0xf5a060, 0x4a3040, 0.4);
    this.scene.add(this.hemiLight);

    // Target lighting values (for smooth city restoration transitions)
    this.targetAmbient = 0.5;
    this.targetSun = 0.6;
    this.targetFog = 0.012;
  }

  // Update lighting based on city restoration stage
  setCityStage(stage) {
    this.targetAmbient = stage.ambientIntensity;
    this.targetSun = stage.sunIntensity;
    this.targetFog = stage.fogDensity;
  }

  update(dt) {
    // Smoothly interpolate lighting toward target values
    const speed = 2;
    this.ambientLight.intensity = lerp(this.ambientLight.intensity, this.targetAmbient, speed * dt);
    this.sunLight.intensity = lerp(this.sunLight.intensity, this.targetSun, speed * dt);
    this.fillLight.intensity = lerp(this.fillLight.intensity, this.targetSun * 0.5, speed * dt);
    this.hemiLight.intensity = lerp(this.hemiLight.intensity, this.targetSun * 0.4, speed * dt);
    this.scene.fog.density = lerp(this.scene.fog.density, this.targetFog, speed * dt);
  }

  // Move shadow camera to follow player
  updateShadowTarget(playerZ) {
    this.sunLight.position.z = playerZ - 10;
    this.sunLight.target.position.z = playerZ;
    this.sunLight.target.updateMatrixWorld();
  }

  dispose() {
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
