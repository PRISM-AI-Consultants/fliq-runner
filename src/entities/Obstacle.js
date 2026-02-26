// Obstacles that the player must jump over or slide under
// Types: broken streetlights, construction barriers, puddles
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';

const OBSTACLE_TYPES = {
  streetlight: {
    width: 0.8,
    height: 1.2,
    depth: 0.8,
    canJumpOver: true,
    canSlideUnder: false,
    requiresSlide: false,
    color: 0x666666,
    emissive: 0x332200,
  },
  barrier: {
    width: 2.0,
    height: 0.8,
    depth: 0.5,
    canJumpOver: true,
    canSlideUnder: false,
    requiresSlide: false,
    color: 0xff8800,
    emissive: 0x442200,
  },
  puddle: {
    width: 2.0,
    height: 2.0,
    depth: 1.0,
    canJumpOver: false,
    canSlideUnder: true,
    requiresSlide: true,
    color: 0x444488,
    emissive: 0x222244,
  },
  construction: {
    width: 1.5,
    height: 1.5,
    depth: 0.6,
    canJumpOver: true,
    canSlideUnder: false,
    requiresSlide: false,
    color: 0xccaa00,
    emissive: 0x332200,
  },
};

export class Obstacle extends Entity3D {
  constructor(type, lane, zPosition) {
    super();

    const config = OBSTACLE_TYPES[type] || OBSTACLE_TYPES.barrier;
    this.type = type;
    this.lane = lane;
    this.z = zPosition;
    this.x = (lane - 1) * 3; // Lane width
    this.y = 0;

    this.width = config.width;
    this.height = config.height;
    this.depth = config.depth;
    this.canJumpOver = config.canJumpOver;
    this.canSlideUnder = config.canSlideUnder;
    this.requiresSlide = config.requiresSlide;

    this.mesh = this._createMesh(config);
    this.syncMeshPosition();
  }

  _createMesh(config) {
    const group = new THREE.Group();

    switch (this.type) {
      case 'streetlight': {
        // Fallen/broken streetlight pole across lane
        const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8);
        const poleMat = new THREE.MeshStandardMaterial({
          color: config.color,
          roughness: 0.7,
          metalness: 0.5,
        });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.rotation.z = Math.PI / 2;
        pole.position.y = 0.5;
        pole.castShadow = true;
        group.add(pole);

        // Broken lamp
        const lampGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const lampMat = new THREE.MeshStandardMaterial({
          color: 0x888866,
          emissive: 0x332200,
          emissiveIntensity: 0.3,
        });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(1.2, 0.5, 0);
        group.add(lamp);
        break;
      }

      case 'barrier': {
        // Construction barrier / sawhorse
        const barGeo = new THREE.BoxGeometry(2, 0.15, 0.1);
        const barMat = new THREE.MeshStandardMaterial({
          color: config.color,
          roughness: 0.6,
        });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.y = 0.6;
        bar.castShadow = true;
        group.add(bar);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.08, 0.7, 0.08);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x886644 });
        [-0.7, 0.7].forEach(xOff => {
          const leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(xOff, 0.35, 0);
          leg.rotation.z = xOff > 0 ? -0.15 : 0.15;
          group.add(leg);
        });

        // Warning stripes
        const stripeGeo = new THREE.BoxGeometry(0.4, 0.15, 0.12);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        [-0.5, 0.5].forEach(xOff => {
          const stripe = new THREE.Mesh(stripeGeo, stripeMat);
          stripe.position.set(xOff, 0.6, 0.01);
          group.add(stripe);
        });
        break;
      }

      case 'puddle': {
        // Overhead pipe/beam to slide under
        const beamGeo = new THREE.BoxGeometry(2.5, 0.3, 0.3);
        const beamMat = new THREE.MeshStandardMaterial({
          color: 0x666666,
          roughness: 0.6,
          metalness: 0.4,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 1.2;
        beam.castShadow = true;
        group.add(beam);

        // Support posts
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6);
        [-1, 1].forEach(side => {
          const post = new THREE.Mesh(postGeo, beamMat.clone());
          post.position.set(side * 1.1, 0.6, 0);
          group.add(post);
        });
        break;
      }

      case 'construction': {
        // Traffic cone cluster
        const coneGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
        const coneMat = new THREE.MeshStandardMaterial({
          color: config.color,
          roughness: 0.6,
        });
        [[-0.3, 0], [0.3, 0], [0, 0.2]].forEach(([xOff, zOff]) => {
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.set(xOff, 0.25, zOff);
          cone.castShadow = true;
          group.add(cone);
        });

        // Barrier board
        const boardGeo = new THREE.BoxGeometry(1.5, 0.6, 0.08);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.y = 0.7;
        board.castShadow = true;
        group.add(board);
        break;
      }
    }

    return group;
  }

  update(dt) {
    // Obstacles are static - they just exist at their Z position
    // Could add wobble/shake animation here
  }
}
