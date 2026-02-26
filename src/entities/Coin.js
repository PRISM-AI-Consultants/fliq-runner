// Standard path coins - small Flow energy collectibles (+1 Flow each)
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';

export class Coin extends Entity3D {
  constructor(lane, zPosition) {
    super();
    this.lane = lane;
    this.z = zPosition;
    this.x = (lane - 1) * 3;
    this.y = 1.0;      // Float at waist height
    this.depth = 0.5;
    this.width = 0.5;
    this.value = 1;     // +1 Flow
    this.collectRadius = 1.5;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spinSpeed = 2;

    this.mesh = this._createMesh();
    this.syncMeshPosition();
  }

  _createMesh() {
    const group = new THREE.Group();

    // Coin disc
    const coinGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0xf5a623,
      emissiveIntensity: 0.3,
    });
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.z = Math.PI / 2; // Face the player
    group.add(coin);

    // Inner circle detail
    const innerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xf5c542,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xf5c542,
      emissiveIntensity: 0.2,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.z = Math.PI / 2;
    group.add(inner);

    return group;
  }

  update(dt) {
    if (this.collected) return;

    // Bob up and down
    this.bobPhase += dt * 2;
    this.mesh.position.y = this.y + Math.sin(this.bobPhase) * 0.15;

    // Spin
    this.mesh.rotation.y += this.spinSpeed * dt;

    // Update X/Z
    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;
  }

  // Collect animation
  collect() {
    this.collected = true;
    this.active = false;
    // Scale down and fade (done via the level's particle system)
  }
}
