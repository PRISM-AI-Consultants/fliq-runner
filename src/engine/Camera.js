// Third-person follow camera for runner view
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { smoothDamp } from '../utils/math.js';

export class Camera {
  constructor() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      aspect,
      CONFIG.camera.near,
      CONFIG.camera.far
    );

    // Initial position (behind and above player)
    this.camera.position.set(
      CONFIG.camera.offsetX,
      CONFIG.camera.offsetY,
      CONFIG.camera.offsetZ
    );

    // Smooth follow state
    this.currentX = 0;
    this.currentY = CONFIG.camera.offsetY;
    this.currentZ = CONFIG.camera.offsetZ;

    // Look target
    this.lookTarget = new THREE.Vector3(0, CONFIG.camera.lookAheadY, 0);

    // Handle resize
    this._onResize = this.onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  // Follow the player with smooth damping
  follow(playerX, playerY, playerZ, dt) {
    const cfg = CONFIG.camera;

    // Target position: behind and above player
    const targetX = playerX + cfg.offsetX;
    const targetY = playerY + cfg.offsetY;
    const targetZ = playerZ + cfg.offsetZ;

    // Smooth follow
    this.currentX = smoothDamp(this.currentX, targetX, cfg.lerpSpeed, dt);
    this.currentY = smoothDamp(this.currentY, targetY, cfg.lerpSpeed * 0.5, dt);
    this.currentZ = smoothDamp(this.currentZ, targetZ, cfg.lerpSpeed, dt);

    this.camera.position.set(this.currentX, this.currentY, this.currentZ);

    // Look at point slightly ahead of player
    this.lookTarget.set(playerX, playerY + cfg.lookAheadY, playerZ - 10);
    this.camera.lookAt(this.lookTarget);
  }

  // Snap to position (no smoothing - used on level start)
  snapTo(playerX, playerY, playerZ) {
    const cfg = CONFIG.camera;
    this.currentX = playerX + cfg.offsetX;
    this.currentY = playerY + cfg.offsetY;
    this.currentZ = playerZ + cfg.offsetZ;
    this.camera.position.set(this.currentX, this.currentY, this.currentZ);
    this.lookTarget.set(playerX, playerY + cfg.lookAheadY, playerZ - 10);
    this.camera.lookAt(this.lookTarget);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
  }
}
