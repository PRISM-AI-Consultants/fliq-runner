// Base entity class for all 3D game objects
import * as THREE from 'three';
import { uid } from '../utils/math.js';

export class Entity3D {
  constructor() {
    this.id = uid();
    this.mesh = null;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.lane = 1;      // 0=left, 1=center, 2=right
    this.depth = 1;     // Z extent for collision
    this.width = 1;     // X extent
    this.height = 1;    // Y extent
    this.active = true;
    this.collected = false;
    this.markedForRemoval = false;
  }

  // Add mesh to scene
  addToScene(scene) {
    if (this.mesh) {
      scene.add(this.mesh);
    }
  }

  // Remove mesh from scene
  removeFromScene(scene) {
    if (this.mesh) {
      scene.remove(this.mesh);
    }
  }

  // Update mesh position to match entity state
  syncMeshPosition() {
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
    }
  }

  update(dt) {
    // Override in subclasses
  }

  dispose() {
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }
}
