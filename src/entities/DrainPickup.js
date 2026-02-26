// Temptation/drain items - visually appealing but cost Flow
// Toys, candy, ice cream, sneakers, gadgets
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';

const DRAIN_VISUALS = {
  toy: { color: 0xff4444, emissive: 0xff2222, shape: 'star' },
  candy: { color: 0xff69b4, emissive: 0xff1493, shape: 'sphere' },
  icecream: { color: 0xffe4c4, emissive: 0xffb6c1, shape: 'cone' },
  sneakers: { color: 0x8844ff, emissive: 0x6633cc, shape: 'box' },
  gamepad: { color: 0x44aaff, emissive: 0x2288ff, shape: 'box' },
};

export class DrainPickup extends Entity3D {
  constructor(type, lane, zPosition, flowCost = -10) {
    super();
    this.pickupType = type;
    this.lane = lane;
    this.z = zPosition;
    this.x = (lane - 1) * 3;
    this.y = 1.0;
    this.depth = 0.8;
    this.width = 0.8;
    this.value = flowCost; // Negative value
    this.collectRadius = 1.8;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.isDrainPickup = true;

    const visual = DRAIN_VISUALS[type] || DRAIN_VISUALS.toy;
    this.mesh = this._createMesh(visual);
    this.syncMeshPosition();
  }

  _createMesh(visual) {
    const group = new THREE.Group();

    let geo;
    switch (visual.shape) {
      case 'sphere':
        geo = new THREE.SphereGeometry(0.3, 16, 12);
        break;
      case 'cone':
        geo = new THREE.ConeGeometry(0.2, 0.5, 16);
        break;
      case 'star': {
        // Simple star-like shape using icosahedron
        geo = new THREE.IcosahedronGeometry(0.3, 0);
        break;
      }
      default:
        geo = new THREE.BoxGeometry(0.4, 0.35, 0.3);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: visual.color,
      roughness: 0.3,
      metalness: 0.3,
      emissive: visual.emissive,
      emissiveIntensity: 0.5,
    });
    const main = new THREE.Mesh(geo, mat);
    main.castShadow = true;
    group.add(main);

    // Temptation sparkles (small floating dots)
    const sparkleGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const sparkleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: visual.emissive,
      emissiveIntensity: 0.8,
    });
    for (let i = 0; i < 4; i++) {
      const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
      const angle = (i / 4) * Math.PI * 2;
      sparkle.position.set(
        Math.cos(angle) * 0.4,
        0.1 + Math.sin(angle) * 0.2,
        Math.sin(angle) * 0.4
      );
      sparkle.userData.angle = angle;
      group.add(sparkle);
    }
    this.sparkles = group.children.slice(1);

    return group;
  }

  update(dt) {
    if (this.collected) return;

    // Bob
    this.bobPhase += dt * 2;
    this.mesh.position.y = this.y + Math.sin(this.bobPhase) * 0.15;

    // Spin (slightly faster than flow pickups - more flashy/distracting)
    this.mesh.rotation.y += dt * 2.5;

    // Animate sparkles
    this.sparkles.forEach((s, i) => {
      const angle = s.userData.angle + this.bobPhase;
      s.position.set(
        Math.cos(angle) * 0.45,
        0.15 + Math.sin(this.bobPhase * 2 + i) * 0.15,
        Math.sin(angle) * 0.45
      );
    });

    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;
  }

  collect() {
    this.collected = true;
    this.active = false;
  }
}
