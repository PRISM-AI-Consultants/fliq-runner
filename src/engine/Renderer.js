// Three.js WebGL Renderer with warm bloom post-processing
// OPTIMIZED: half-res bloom, capped pixel ratio, basic shadow map
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CONFIG } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;

    // WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: CONFIG.renderer.antialias,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Cap pixel ratio at 1.5 (retina at 2x doubles GPU work for minimal visual gain)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Fastest shadow type
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Post-processing
    this.composer = null;
    this.bloomPass = null;

    // Handle resize
    this._onResize = this.onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  setupPostProcessing(scene, camera) {
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Bloom at half resolution for performance
    const bloomWidth = Math.floor(window.innerWidth / 2);
    const bloomHeight = Math.floor(window.innerHeight / 2);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(bloomWidth, bloomHeight),
      CONFIG.renderer.bloomStrength,
      CONFIG.renderer.bloomRadius,
      CONFIG.renderer.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);
  }

  render(scene, camera) {
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(scene, camera);
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  // Adjust bloom for city restoration level
  setBloomIntensity(intensity) {
    if (this.bloomPass) {
      this.bloomPass.strength = CONFIG.renderer.bloomStrength * (0.5 + intensity * 0.5);
    }
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    if (this.composer) {
      this.composer.dispose();
    }
  }
}
