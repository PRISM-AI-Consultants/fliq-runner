// Procedural city building generation for Velo City
// Pixar-style neighborhood: row houses, storefronts, trees, streetlights
// OPTIMIZED: reduced draw calls, no point lights, shared materials, fewer shadow casters
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { randomRange } from '../utils/math.js';

// Shared materials (one instance each, never cloned unless needed for emissive changes)
const BRICK_COLORS = [0x8b4513, 0xa0522d, 0x7b3f2e, 0x9c5a3c, 0x6b3a2a, 0xb8786e];
const AWNING_COLORS = [0xcc3333, 0x3366aa, 0x228833, 0xcc8833, 0x884488, 0xcc6644];

// Pre-create a small set of brick materials (6 colors, shared across all buildings)
const BRICK_MATS = BRICK_COLORS.map(c =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
);

const SHARED = {
  window_dark: new THREE.MeshStandardMaterial({ color: 0x2a2035, roughness: 0.3, metalness: 0.4 }),
  window_lit: new THREE.MeshStandardMaterial({
    color: 0xffe4b5, roughness: 0.3, emissive: 0xffe4b5, emissiveIntensity: 0.5,
  }),
  door: new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.7 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 }),
  tree_trunk: new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 }),
  tree_leaves: new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.8 }),
  pole: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.7 }),
  lamp: new THREE.MeshStandardMaterial({
    color: 0xffe4b5, emissive: 0xf5c542, emissiveIntensity: 0.3,
  }),
};

// Pre-create awning materials (shared set)
const AWNING_MATS = AWNING_COLORS.map(c =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })
);

// Pre-create shared geometries (reuse across all segments)
const GEO = {
  window: new THREE.PlaneGeometry(0.6, 0.8),
  door: new THREE.PlaneGeometry(0.8, 1.6),
  awning: new THREE.BoxGeometry(1.2, 0.05, 0.8),
  pole: new THREE.CylinderGeometry(0.06, 0.08, 3.5, 5),
  arm: new THREE.CylinderGeometry(0.04, 0.04, 1, 4),
  lamp: new THREE.SphereGeometry(0.2, 6, 4),
  trunk: new THREE.CylinderGeometry(0.1, 0.15, 1.5, 5),
  canopy: new THREE.SphereGeometry(1.2, 6, 4),
};

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.segmentLength = CONFIG.world.segmentLength;
    this.lampMeshes = []; // Track lamp meshes for glow updates
  }

  createSegment(zPosition) {
    const group = new THREE.Group();
    group.position.z = zPosition;
    const segLen = this.segmentLength;
    const halfStreet = CONFIG.world.streetWidth / 2;

    // Buildings on both sides
    this._generateBuildingRow(group, -halfStreet - 1, segLen, -1);
    this._generateBuildingRow(group, halfStreet + 1, segLen, 1);

    // Streetlights (emissive only, no point lights)
    this._generateStreetlights(group, segLen, halfStreet);

    // Trees (simplified)
    this._generateTrees(group, segLen, halfStreet);

    this.scene.add(group);
    return { group, z: zPosition };
  }

  _generateBuildingRow(group, xBase, segLen, side) {
    let z = 0;
    while (z < segLen) {
      const width = randomRange(3, 6);
      const height = randomRange(CONFIG.world.buildingMinHeight, CONFIG.world.buildingMaxHeight);
      const depth = CONFIG.world.buildingDepth;

      const building = this._createBuilding(width, height, depth);
      building.position.set(
        xBase + (depth / 2) * side,
        height / 2,
        -z - width / 2
      );
      group.add(building);

      z += width + randomRange(0.5, 2);
    }
  }

  _createBuilding(width, height, depth) {
    const buildingGroup = new THREE.Group();

    // Main body - only this casts shadow
    const bodyGeo = new THREE.BoxGeometry(depth, height, width);
    const bodyMat = BRICK_MATS[Math.floor(Math.random() * BRICK_MATS.length)];
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    buildingGroup.add(body);

    // Roof
    const roofGeo = new THREE.BoxGeometry(depth + 0.3, 0.2, width + 0.3);
    const roof = new THREE.Mesh(roofGeo, SHARED.roof);
    roof.position.y = height / 2 + 0.1;
    buildingGroup.add(roof);

    // Windows - reduced count (every other row, fewer columns)
    const windowRows = Math.floor(height / 3); // Was /2, now /3 = fewer rows
    const windowCols = Math.max(1, Math.floor(width / 2.2)); // Was /1.8, now /2.2

    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const isLit = Math.random() > 0.65;
        // Use shared material directly (no clone for dark windows)
        const mat = isLit ? SHARED.window_lit : SHARED.window_dark;

        const windowMesh = new THREE.Mesh(GEO.window, mat);
        windowMesh.position.set(
          depth / 2 + 0.01,
          -height / 2 + 1.5 + row * 3,
          -width / 2 + 1.1 + col * 2.2
        );
        buildingGroup.add(windowMesh);
      }
    }

    // Door (ground level)
    if (Math.random() > 0.4) {
      const door = new THREE.Mesh(GEO.door, SHARED.door);
      door.position.set(depth / 2 + 0.01, -height / 2 + 0.8, 0);
      buildingGroup.add(door);

      // Awning
      if (Math.random() > 0.5) {
        const awningMat = AWNING_MATS[Math.floor(Math.random() * AWNING_MATS.length)];
        const awning = new THREE.Mesh(GEO.awning, awningMat);
        awning.position.set(depth / 2 + 0.5, -height / 2 + 1.8, 0);
        buildingGroup.add(awning);
      }
    }

    return buildingGroup;
  }

  _generateStreetlights(group, segLen, halfStreet) {
    // Fewer streetlights, wider spacing
    for (let z = 6; z < segLen; z += randomRange(10, 16)) {
      const side = Math.random() > 0.5 ? -1 : 1;
      const light = this._createStreetlight();
      light.position.set(
        side * (halfStreet - CONFIG.world.sidewalkWidth + 0.5),
        0,
        -z
      );
      group.add(light);
    }
  }

  _createStreetlight() {
    const lightGroup = new THREE.Group();

    // Pole (no shadow casting)
    const pole = new THREE.Mesh(GEO.pole, SHARED.pole);
    pole.position.y = 1.75;
    lightGroup.add(pole);

    // Arm
    const arm = new THREE.Mesh(GEO.arm, SHARED.pole);
    arm.position.set(0.4, 3.4, 0);
    arm.rotation.z = Math.PI / 2;
    lightGroup.add(arm);

    // Lamp head (emissive glow only - NO point light)
    const lampMat = SHARED.lamp.clone(); // Must clone for individual glow control
    const lamp = new THREE.Mesh(GEO.lamp, lampMat);
    lamp.position.set(0.8, 3.4, 0);
    lightGroup.add(lamp);

    lightGroup.userData.lampMat = lampMat;
    this.lampMeshes.push(lightGroup);
    return lightGroup;
  }

  _generateTrees(group, segLen, halfStreet) {
    for (let z = 4; z < segLen; z += randomRange(8, 14)) {
      if (Math.random() > 0.5) continue; // Fewer trees
      const side = Math.random() > 0.5 ? -1 : 1;
      const tree = this._createTree();
      tree.position.set(
        side * (halfStreet - CONFIG.world.sidewalkWidth / 2),
        0,
        -z
      );
      group.add(tree);
    }
  }

  _createTree() {
    const treeGroup = new THREE.Group();

    // Trunk (no shadow)
    const trunk = new THREE.Mesh(GEO.trunk, SHARED.tree_trunk);
    trunk.position.y = 0.75;
    treeGroup.add(trunk);

    // Single canopy sphere (was 3 layered spheres)
    const canopy = new THREE.Mesh(GEO.canopy, SHARED.tree_leaves);
    canopy.position.y = 2.2;
    canopy.castShadow = true;
    treeGroup.add(canopy);

    return treeGroup;
  }

  // Update streetlight brightness based on restoration level
  setRestorationLevel(ratio) {
    const baseGlow = 0.3;
    this.lampMeshes.forEach((light, i) => {
      const threshold = (i % 8) / 8;
      const isOn = ratio > threshold;
      if (light.userData.lampMat) {
        light.userData.lampMat.emissiveIntensity = isOn ? 0.9 : baseGlow;
      }
    });
  }

  // Update visible segments
  update(playerZ) {
    const segLen = this.segmentLength;
    const visibleAhead = CONFIG.world.visibleSegments;

    const currentSegIndex = Math.floor(-playerZ / segLen);
    const neededStart = currentSegIndex - 1;
    const neededEnd = currentSegIndex + visibleAhead;

    // Remove old segments
    this.segments = this.segments.filter(seg => {
      const segIndex = Math.floor(-seg.z / segLen);
      if (segIndex < neededStart - 1) {
        this.scene.remove(seg.group);
        return false;
      }
      return true;
    });

    // Add new segments
    const existingIndices = new Set(this.segments.map(s => Math.floor(-s.z / segLen)));
    for (let i = neededStart; i <= neededEnd; i++) {
      if (!existingIndices.has(i)) {
        const seg = this.createSegment(-i * segLen);
        this.segments.push(seg);
      }
    }
  }

  dispose() {
    this.segments.forEach(seg => this.scene.remove(seg.group));
    this.segments = [];
    this.lampMeshes = [];
  }
}
