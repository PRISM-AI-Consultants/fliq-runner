// High-value Flow pickups - visual items representing good financial choices
// Piggy banks, grocery bags, books, savings jars, etc.
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';

const PICKUP_VISUALS = {
  piggybank: { color: 0xff9faa, emissive: 0xf5c542, shape: 'sphere' },
  groceries: { color: 0x4a7c3f, emissive: 0x2ecc71, shape: 'box' },
  books: { color: 0x3498db, emissive: 0x2980b9, shape: 'box' },
  savingsjar: { color: 0xf5c542, emissive: 0xffd700, shape: 'cylinder' },
  chest: { color: 0xd4a574, emissive: 0xffd700, shape: 'box' },
  flowseed: { color: 0x4ecdc4, emissive: 0x2ecc71, shape: 'sphere' },
};

export class FlowPickup extends Entity3D {
  constructor(type, lane, zPosition, flowValue = 15) {
    super();
    this.pickupType = type;
    this.lane = lane;
    this.z = zPosition;
    this.x = (lane - 1) * 3;
    this.y = 1.0;
    this.depth = 0.8;
    this.width = 0.8;
    this.value = flowValue;
    this.collectRadius = 1.8;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.isFlowPickup = true;

    const visual = PICKUP_VISUALS[type] || PICKUP_VISUALS.piggybank;
    this.mesh = this._createMesh(visual);
    this.syncMeshPosition();
  }

  _createMesh(visual) {
    const group = new THREE.Group();

    // Main shape
    let geo;
    switch (visual.shape) {
      case 'sphere':
        geo = new THREE.SphereGeometry(0.35, 16, 12);
        break;
      case 'cylinder':
        geo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
        break;
      default:
        geo = new THREE.BoxGeometry(0.5, 0.4, 0.35);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: visual.color,
      roughness: 0.4,
      metalness: 0.2,
      emissive: visual.emissive,
      emissiveIntensity: 0.4,
    });
    const main = new THREE.Mesh(geo, mat);
    main.castShadow = true;
    group.add(main);

    // Glow ring (warm golden)
    const ringGeo = new THREE.TorusGeometry(0.45, 0.03, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf5c542,
      emissive: 0xf5c542,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    this.glowRing = ring;

    return group;
  }

  update(dt) {
    if (this.collected) return;

    // Bob and gentle spin
    this.bobPhase += dt * 1.5;
    this.mesh.position.y = this.y + Math.sin(this.bobPhase) * 0.2;
    this.mesh.rotation.y += dt * 1.5;

    // Pulse the glow ring
    if (this.glowRing) {
      const scale = 1 + Math.sin(this.bobPhase * 2) * 0.1;
      this.glowRing.scale.set(scale, scale, 1);
    }

    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;
  }

  collect() {
    this.collected = true;
    this.active = false;
  }
}
