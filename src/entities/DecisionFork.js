// Decision fork - split-path choice point
// Presents two options in different lanes with visual cues
// This is the CORE mechanic for FLIQ data collection
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';

export class DecisionFork extends Entity3D {
  constructor(decisionData, zPosition) {
    super();
    this.decision = decisionData;
    this.z = zPosition;
    this.x = 0;
    this.y = 0;
    this.depth = 6; // Wide trigger zone
    this.width = 8;

    // State
    this.triggered = false;   // Player entered zone
    this.resolved = false;    // Player made a choice
    this.choiceMade = null;   // 'A' or 'B'
    this.promptShownAt = 0;   // Timestamp for deliberation tracking

    // Visual indicators for each option
    this.mesh = this._createMesh();
    this.syncMeshPosition();

    this.optionAMesh = null;
    this.optionBMesh = null;
  }

  _createMesh() {
    const group = new THREE.Group();
    const d = this.decision;

    // Ground indicators - glowing lane highlights
    // Option A (usually left lane)
    const laneA = this._createLaneIndicator(
      d.optionA.glowColor,
      (this._laneToX(d.optionA.lane))
    );
    group.add(laneA);
    this.optionAMesh = laneA;

    // Option B (usually right lane)
    const laneB = this._createLaneIndicator(
      d.optionB.glowColor,
      (this._laneToX(d.optionB.lane))
    );
    group.add(laneB);
    this.optionBMesh = laneB;

    // Floating icon markers above each lane
    const iconA = this._createIconMarker(d.optionA.glowColor, d.optionA.icon);
    iconA.position.set(this._laneToX(d.optionA.lane), 2.5, 0);
    group.add(iconA);

    const iconB = this._createIconMarker(d.optionB.glowColor, d.optionB.icon);
    iconB.position.set(this._laneToX(d.optionB.lane), 2.5, 0);
    group.add(iconB);

    // Center divider glow line
    const divGeo = new THREE.PlaneGeometry(0.1, 5);
    const divMat = new THREE.MeshStandardMaterial({
      color: 0xf5c542,
      emissive: 0xf5c542,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.4,
    });
    const divider = new THREE.Mesh(divGeo, divMat);
    divider.rotation.x = -Math.PI / 2;
    divider.position.y = 0.03;
    group.add(divider);

    return group;
  }

  _laneToX(laneName) {
    const map = { left: -3, center: 0, right: 3 };
    return map[laneName] || 0;
  }

  _laneNameToIndex(laneName) {
    const map = { left: 0, center: 1, right: 2 };
    return map[laneName] !== undefined ? map[laneName] : 1;
  }

  _createLaneIndicator(color, xPos) {
    const group = new THREE.Group();

    // Glowing ground patch
    const patchGeo = new THREE.PlaneGeometry(2.5, 4);
    const patchMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
    });
    const patch = new THREE.Mesh(patchGeo, patchMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(xPos, 0.02, 0);
    group.add(patch);

    // Arrow on ground pointing forward
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.5);
    arrowShape.lineTo(0.4, -0.2);
    arrowShape.lineTo(0.15, -0.2);
    arrowShape.lineTo(0.15, -0.5);
    arrowShape.lineTo(-0.15, -0.5);
    arrowShape.lineTo(-0.15, -0.2);
    arrowShape.lineTo(-0.4, -0.2);
    arrowShape.closePath();

    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(xPos, 0.03, 1.5);
    group.add(arrow);

    return group;
  }

  _createIconMarker(color, iconType) {
    const group = new THREE.Group();

    // Floating beacon
    const beaconGeo = new THREE.SphereGeometry(0.35, 16, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    group.add(beacon);

    // Vertical beam of light below
    const beamGeo = new THREE.CylinderGeometry(0.02, 0.15, 2.5, 8);
    const beamMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = -1.25;
    group.add(beam);

    return group;
  }

  update(dt) {
    if (this.resolved) return;

    // Pulse animation on markers
    const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.15;
    if (this.optionAMesh) {
      this.optionAMesh.children.forEach(c => {
        if (c.material && c.material.emissiveIntensity !== undefined) {
          c.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.004) * 0.2;
        }
      });
    }
    if (this.optionBMesh) {
      this.optionBMesh.children.forEach(c => {
        if (c.material && c.material.emissiveIntensity !== undefined) {
          c.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.004 + 1) * 0.2;
        }
      });
    }

    // Sync position
    this.mesh.position.x = this.x;
    this.mesh.position.z = this.z;
  }

  // Check which option the player chose based on their lane
  resolveChoice(playerLane) {
    if (this.resolved) return null;

    const laneA = this._laneNameToIndex(this.decision.optionA.lane);
    const laneB = this._laneNameToIndex(this.decision.optionB.lane);

    if (playerLane === laneA) {
      this.choiceMade = 'A';
      this.resolved = true;
      return this.decision.optionA;
    } else if (playerLane === laneB) {
      this.choiceMade = 'B';
      this.resolved = true;
      return this.decision.optionB;
    }

    // Player was in neither designated lane - default to closest
    const distA = Math.abs(playerLane - laneA);
    const distB = Math.abs(playerLane - laneB);
    if (distA <= distB) {
      this.choiceMade = 'A';
      this.resolved = true;
      return this.decision.optionA;
    } else {
      this.choiceMade = 'B';
      this.resolved = true;
      return this.decision.optionB;
    }
  }
}
