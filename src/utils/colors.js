// Velo City color palette - warm golden hour aesthetic
// NOT neon, NOT sci-fi. Pixar neighborhood warmth.
import * as THREE from 'three';

export const PALETTE = {
  // Sky
  skyTop: new THREE.Color(0x1a1020),
  skyHorizon: new THREE.Color(0xf5a060),
  sunsetGlow: new THREE.Color(0xf5a623),

  // Lighting
  ambientLight: new THREE.Color(0x2d1b3e),
  sunLight: new THREE.Color(0xffd4a0),
  warmGlow: new THREE.Color(0xf5c542),

  // City elements
  brick: new THREE.Color(0x8b4513),
  brickLight: new THREE.Color(0xa0522d),
  concrete: new THREE.Color(0x888888),
  asphalt: new THREE.Color(0x333333),
  sidewalk: new THREE.Color(0x999080),
  windowGlow: new THREE.Color(0xffe4b5),
  windowDark: new THREE.Color(0x1a1020),

  // Activation / Flow
  activationGold: new THREE.Color(0xf5c542),
  activationWarm: new THREE.Color(0xf5a623),
  flowEnergy: new THREE.Color(0x4ecdc4),
  flowTrail: new THREE.Color(0xffd700),

  // Game feedback
  positive: new THREE.Color(0x2ecc71),
  negative: new THREE.Color(0xe74c3c),
  neutral: new THREE.Color(0x95a5a6),

  // Characters
  millerPrimary: new THREE.Color(0x4488cc),
  millerShoes: new THREE.Color(0xf5c542),

  // UI
  uiGold: '#F5A623',
  uiWarm: '#FFD700',
  uiDark: '#1a1020',
  uiLight: '#FFF8E7',
  uiPositive: '#2ecc71',
  uiNegative: '#e74c3c',
};
