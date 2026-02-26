// Golden hour sky for Velo City
// Warm sunset gradient - NOT sci-fi, NOT neon
import * as THREE from 'three';
import { PALETTE } from '../utils/colors.js';

export class SkyGenerator {
  constructor(scene) {
    this.scene = scene;
    this.mesh = this.createSky();
    scene.add(this.mesh);
  }

  createSky() {
    // Large sphere for skybox
    const geo = new THREE.SphereGeometry(100, 32, 32);
    // Flip faces inward
    geo.scale(-1, 1, 1);

    // Gradient shader for golden hour
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x2a1840) },
        horizonColor: { value: new THREE.Color(0xf5a060) },
        bottomColor: { value: new THREE.Color(0x6b3a50) },
        sunColor: { value: new THREE.Color(0xffd4a0) },
        sunPosition: { value: new THREE.Vector3(-0.5, 0.15, -1.0).normalize() },
        intensity: { value: 0.8 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        uniform vec3 sunColor;
        uniform vec3 sunPosition;
        uniform float intensity;

        varying vec3 vWorldPosition;

        void main() {
          vec3 dir = normalize(vWorldPosition);
          float heightFactor = dir.y * 0.5 + 0.5; // 0 at bottom, 1 at top

          // Sky gradient
          vec3 color;
          if (heightFactor > 0.5) {
            color = mix(horizonColor, topColor, (heightFactor - 0.5) * 2.0);
          } else {
            color = mix(bottomColor, horizonColor, heightFactor * 2.0);
          }

          // Sun glow - generous for golden hour warmth
          float sunDot = max(dot(dir, sunPosition), 0.0);
          float sunGlow = pow(sunDot, 6.0) * 0.8;
          float sunHalo = pow(sunDot, 2.0) * 0.25;
          color += sunColor * (sunGlow + sunHalo) * intensity;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geo, mat);
  }

  // Update sky brightness based on city restoration
  setIntensity(value) {
    if (this.mesh.material.uniforms) {
      this.mesh.material.uniforms.intensity.value = 0.8 + value * 0.4;
    }
  }

  // Keep sky centered on camera
  update(cameraPosition) {
    this.mesh.position.copy(cameraPosition);
  }
}
