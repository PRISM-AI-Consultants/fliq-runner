// Road and sidewalk generation for Velo City
// OPTIMIZED: shared materials, fewer lane dashes, shared geometries
import * as THREE from 'three';
import { CONFIG } from '../config.js';

// Shared materials (single instances)
const ROAD_MAT = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
const DASH_MAT = new THREE.MeshStandardMaterial({
  color: 0x888855, roughness: 0.8, emissive: 0x444422, emissiveIntensity: 0.1,
});
const SIDEWALK_MAT = new THREE.MeshStandardMaterial({ color: 0x999080, roughness: 0.85 });
const CURB_MAT = new THREE.MeshStandardMaterial({ color: 0x777770, roughness: 0.8 });
const CROSSWALK_MAT = new THREE.MeshStandardMaterial({ color: 0xeeeecc, roughness: 0.7 });

// Shared geometries
const DASH_GEO = new THREE.PlaneGeometry(0.15, 1.5);
const CROSSWALK_GEO = new THREE.PlaneGeometry(0.8, 3);

export class GroundGenerator {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.segmentLength = CONFIG.world.segmentLength;
  }

  createSegment(zPosition) {
    const group = new THREE.Group();
    group.position.z = zPosition;
    const segLen = this.segmentLength;

    // Asphalt road
    const roadGeo = new THREE.PlaneGeometry(
      CONFIG.world.streetWidth - CONFIG.world.sidewalkWidth * 2, segLen
    );
    const road = new THREE.Mesh(roadGeo, ROAD_MAT);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.position.z = -segLen / 2;
    road.receiveShadow = true;
    group.add(road);

    // Lane dashes - wider spacing (every 6 units instead of 4)
    const laneWidth = CONFIG.runner.laneWidth;
    for (const laneOffset of [-laneWidth, laneWidth]) {
      for (let i = 0; i < segLen; i += 6) {
        const dash = new THREE.Mesh(DASH_GEO, DASH_MAT);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(laneOffset, 0.02, -i);
        group.add(dash);
      }
    }

    // Sidewalks
    const swGeo = new THREE.PlaneGeometry(CONFIG.world.sidewalkWidth, segLen);
    const leftSW = new THREE.Mesh(swGeo, SIDEWALK_MAT);
    leftSW.rotation.x = -Math.PI / 2;
    leftSW.position.set(
      -(CONFIG.world.streetWidth / 2 - CONFIG.world.sidewalkWidth / 2),
      0.05, -segLen / 2
    );
    leftSW.receiveShadow = true;
    group.add(leftSW);

    const rightSW = new THREE.Mesh(swGeo, SIDEWALK_MAT);
    rightSW.rotation.x = -Math.PI / 2;
    rightSW.position.set(
      CONFIG.world.streetWidth / 2 - CONFIG.world.sidewalkWidth / 2,
      0.05, -segLen / 2
    );
    rightSW.receiveShadow = true;
    group.add(rightSW);

    // Curbs
    const curbGeo = new THREE.BoxGeometry(0.2, 0.12, segLen);
    const leftCurb = new THREE.Mesh(curbGeo, CURB_MAT);
    leftCurb.position.set(
      -(CONFIG.world.streetWidth / 2 - CONFIG.world.sidewalkWidth),
      0.06, -segLen / 2
    );
    group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, CURB_MAT);
    rightCurb.position.set(
      CONFIG.world.streetWidth / 2 - CONFIG.world.sidewalkWidth,
      0.06, -segLen / 2
    );
    group.add(rightCurb);

    // Occasional crosswalk (fewer)
    if (Math.random() > 0.6) {
      const cwZ = -segLen * 0.7;
      for (let i = 0; i < 5; i++) {
        const strip = new THREE.Mesh(CROSSWALK_GEO, CROSSWALK_MAT);
        strip.rotation.x = -Math.PI / 2;
        strip.position.set(-2 + i * 1, 0.025, cwZ);
        group.add(strip);
      }
    }

    this.scene.add(group);
    return { group, z: zPosition };
  }

  update(playerZ) {
    const segLen = this.segmentLength;
    const visibleAhead = CONFIG.world.visibleSegments;
    const currentSegIndex = Math.floor(-playerZ / segLen);
    const neededStart = currentSegIndex - 1;
    const neededEnd = currentSegIndex + visibleAhead;

    this.segments = this.segments.filter(seg => {
      const segIndex = Math.floor(-seg.z / segLen);
      if (segIndex < neededStart - 1) {
        this.scene.remove(seg.group);
        return false;
      }
      return true;
    });

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
  }
}
