// Simple 3D particle system for visual effects
// Warm golden collection bursts, activation trails, etc.
import * as THREE from 'three';

export class Particle3D {
  constructor(scene, maxParticles = 200) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.particles = [];

    // Shared geometry for all particles (small sphere)
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  // Emit a burst of particles at position
  burst(x, y, z, color = 0xf5c542, count = 12, speed = 3) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (i / count) * Math.PI * 2;
      const upAngle = Math.random() * Math.PI * 0.5;
      this.particles.push({
        x, y, z,
        vx: Math.cos(angle) * Math.sin(upAngle) * speed * (0.5 + Math.random()),
        vy: Math.cos(upAngle) * speed * (0.5 + Math.random()),
        vz: Math.sin(angle) * Math.sin(upAngle) * speed * (0.5 + Math.random()),
        r: c.r, g: c.g, b: c.b,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        size: 0.1 + Math.random() * 0.1,
      });
    }
  }

  // Emit a trail particle (for player shoes)
  trail(x, y, z, color = 0xf5c542) {
    if (this.particles.length >= this.maxParticles) return;
    const c = new THREE.Color(color);
    this.particles.push({
      x: x + (Math.random() - 0.5) * 0.3,
      y: y + Math.random() * 0.1,
      z: z + (Math.random() - 0.5) * 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.5 + Math.random() * 0.5,
      vz: (Math.random() - 0.5) * 0.3,
      r: c.r, g: c.g, b: c.b,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.3 + Math.random() * 0.2,
      size: 0.06 + Math.random() * 0.04,
    });
  }

  update(dt) {
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    const sizes = this.geometry.attributes.size.array;

    // Update particles and remove dead ones
    this.particles = this.particles.filter(p => {
      p.life -= dt;
      if (p.life <= 0) return false;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 5 * dt; // Gravity
      return true;
    });

    // Write to buffers
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const alpha = p.life / p.maxLife;
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        colors[i * 3] = p.r * alpha;
        colors[i * 3 + 1] = p.g * alpha;
        colors[i * 3 + 2] = p.b * alpha;
        sizes[i] = p.size * alpha;
      } else {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -100;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}
