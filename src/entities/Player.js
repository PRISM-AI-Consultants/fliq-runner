// Player character - the runner
// Auto-runs forward, player controls lane switching, jump, and slide
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';
import { CONFIG } from '../config.js';
import { smoothDamp, clamp, lerp } from '../utils/math.js';
import { getCharacter } from '../data/characters.js';

export class Player extends Entity3D {
  constructor(characterId = 'miller') {
    super();
    this.characterData = getCharacter(characterId);

    // Lane state (0=left, 1=center, 2=right)
    this.lane = 1;
    this.targetLane = 1;
    this.laneWidth = CONFIG.runner.laneWidth;

    // Position
    this.x = 0;
    this.y = 0;
    this.z = 0;

    // Forward speed (auto-run)
    this.speed = CONFIG.runner.baseSpeed;
    this.maxSpeed = CONFIG.runner.baseSpeed * CONFIG.runner.maxSpeedMultiplier;

    // Vertical state (jump/slide)
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.jumpTimer = 0;
    this.slideTimer = 0;
    this.onGround = true;

    // Animation state
    this.runCycle = 0;
    this.bobOffset = 0;
    this.landSquash = 0;
    this.shoeGlowPulse = 0;

    // Hit state
    this.invincible = false;
    this.invincibleTimer = 0;
    this.hitFlash = 0;

    // Collision dimensions
    this.width = 0.8;
    this.height = 1.6;
    this.depth = 0.8;

    // Build placeholder mesh
    this.mesh = this._createPlaceholderMesh();
  }

  _createPlaceholderMesh() {
    const group = new THREE.Group();
    const char = this.characterData;

    // Body (capsule shape)
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: char.bodyColor,
      roughness: 0.6,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    const headMat = new THREE.MeshStandardMaterial({
      color: char.skinColor,
      roughness: 0.7,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    group.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.24, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: char.hairColor, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.5;
    group.add(hair);

    // Shoes (signature glowing shoes)
    this.shoeMaterial = new THREE.MeshStandardMaterial({
      color: char.shoeColor,
      roughness: 0.3,
      emissive: char.shoeColor,
      emissiveIntensity: 0.5,
    });

    const shoeGeo = new THREE.BoxGeometry(0.2, 0.12, 0.35);
    const leftShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial);
    leftShoe.position.set(-0.12, 0.06, 0.05);
    group.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, this.shoeMaterial.clone());
    rightShoe.position.set(0.12, 0.06, 0.05);
    group.add(rightShoe);
    this.leftShoe = leftShoe;
    this.rightShoe = rightShoe;

    // Arms (simple cylinders)
    const armGeo = new THREE.CapsuleGeometry(0.06, 0.3, 3, 4);
    const armMat = new THREE.MeshStandardMaterial({ color: char.shirtColor, roughness: 0.7 });

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.38, 0.85, 0);
    group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, armMat.clone());
    rightArm.position.set(0.38, 0.85, 0);
    group.add(rightArm);
    this.rightArm = rightArm;

    return group;
  }

  update(dt, input) {
    // Lane switching (edge-triggered)
    if (input.leftPressed && this.targetLane > 0) {
      this.targetLane--;
    }
    if (input.rightPressed && this.targetLane < 2) {
      this.targetLane++;
    }

    // Smooth lane movement
    const targetX = (this.targetLane - 1) * this.laneWidth;
    this.x = smoothDamp(this.x, targetX, CONFIG.runner.laneSwitchSpeed, dt);
    this.lane = this.targetLane;

    // Forward movement (auto-run, player goes in -Z direction)
    this.z -= this.speed * dt;

    // Speed acceleration within level
    this.speed = Math.min(this.speed + CONFIG.runner.accelerationRate * dt, this.maxSpeed);

    // Jump
    if (input.jumpPressed && this.onGround && !this.isSliding) {
      this.isJumping = true;
      this.onGround = false;
      this.vy = CONFIG.runner.jumpForce;
      this.jumpTimer = CONFIG.runner.jumpDuration;
    }

    // Slide
    if (input.slidePressed && this.onGround && !this.isJumping) {
      this.isSliding = true;
      this.slideTimer = CONFIG.runner.slideDuration;
    }

    // Update vertical position (jump arc)
    if (this.isJumping) {
      this.vy -= CONFIG.runner.gravity * dt;
      this.y += this.vy * dt;
      this.jumpTimer -= dt;

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
        this.onGround = true;
        this.landSquash = 0.3;
      }
    }

    // Update slide
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.hitFlash = 0;
      }
    }

    // Update animations
    this._updateAnimation(dt);

    // Sync mesh
    this.syncMeshPosition();
  }

  _updateAnimation(dt) {
    // Run cycle
    this.runCycle += dt * this.speed * 0.8;

    // Shoe glow pulse
    this.shoeGlowPulse += dt * 3;
    const glowIntensity = 0.3 + Math.sin(this.shoeGlowPulse) * 0.2;
    if (this.shoeMaterial) {
      this.shoeMaterial.emissiveIntensity = glowIntensity;
    }

    // Arm swing (running animation)
    if (this.leftArm && this.rightArm) {
      if (this.isSliding) {
        // Arms back during slide
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
      } else {
        const swing = Math.sin(this.runCycle) * 0.5;
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
      }
    }

    // Shoe animation (running footstep)
    if (this.leftShoe && this.rightShoe && !this.isJumping) {
      const footLift = Math.abs(Math.sin(this.runCycle)) * 0.1;
      this.leftShoe.position.y = 0.06 + (Math.sin(this.runCycle) > 0 ? footLift : 0);
      this.rightShoe.position.y = 0.06 + (Math.sin(this.runCycle) < 0 ? footLift : 0);
    }

    // Landing squash
    if (this.landSquash > 0) {
      this.landSquash -= dt * 3;
      const squashY = 1 - this.landSquash * 0.2;
      const squashXZ = 1 + this.landSquash * 0.1;
      this.mesh.scale.set(squashXZ, squashY, squashXZ);
    } else {
      this.mesh.scale.set(1, 1, 1);
    }

    // Slide pose
    if (this.isSliding) {
      this.mesh.scale.y = 0.5;
      this.mesh.position.y = this.y;
    }

    // Hit flash (blink when invincible)
    if (this.invincible) {
      this.hitFlash += dt;
      this.mesh.visible = Math.floor(this.hitFlash * 10) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }
  }

  // Called when player hits an obstacle
  hit() {
    if (this.invincible) return false;
    this.invincible = true;
    this.invincibleTimer = 1.5;
    this.hitFlash = 0;
    return true;
  }

  // Set speed for level
  setSpeed(base, max) {
    this.speed = base;
    this.maxSpeed = max;
  }

  // Reset for new level
  reset() {
    this.lane = 1;
    this.targetLane = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.onGround = true;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.speed = CONFIG.runner.baseSpeed;
  }
}
