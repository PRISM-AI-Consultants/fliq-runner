// Player character - the runner
// Auto-runs forward, player controls lane switching, jump, and slide
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';
import { CONFIG } from '../config.js';
import { smoothDamp, clamp, lerp, easeOutElastic, easeOutCubic } from '../utils/math.js';
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

    // --- Enhanced animation state ---
    // Lean into turns
    this.leanAngle = 0;
    this.targetLeanAngle = 0;

    // Head bob base Y (set after mesh creation)
    this.headBaseY = 1.45;

    // Celebration reaction
    this.celebrateTimer = 0;
    this.celebrateDuration = 0.5;
    this.celebrateBounceVy = 0;

    // Stumble reaction
    this.stumbleTimer = 0;
    this.stumbleDuration = 0.3;

    // Speed visual ratio (0 = base speed, 1 = max speed)
    this.speedRatio = 0;

    // Landing impact (enhanced squash/stretch)
    this.landImpactTimer = 0;
    this.wasJumping = false;

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
    this.head = head;

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.24, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMat = new THREE.MeshStandardMaterial({ color: char.hairColor, roughness: 0.9 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.5;
    group.add(hair);
    this.hair = hair;

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

    this.rightShoeMaterial = this.shoeMaterial.clone();
    const rightShoe = new THREE.Mesh(shoeGeo, this.rightShoeMaterial);
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

    // Track if we were jumping (for land impact detection)
    this.wasJumping = this.isJumping;

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
        // Enhanced landing impact
        this.landSquash = 0.3;
        this.landImpactTimer = 0.25;
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

    // Celebration timer
    if (this.celebrateTimer > 0) {
      this.celebrateTimer -= dt;
      if (this.celebrateTimer <= 0) {
        this.celebrateTimer = 0;
        this.celebrateBounceVy = 0;
      }
    }

    // Stumble timer
    if (this.stumbleTimer > 0) {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.stumbleTimer = 0;
      }
    }

    // Landing impact timer
    if (this.landImpactTimer > 0) {
      this.landImpactTimer -= dt;
      if (this.landImpactTimer <= 0) {
        this.landImpactTimer = 0;
      }
    }

    // Compute speed ratio (0 at base speed, 1 at max speed)
    const speedRange = this.maxSpeed - CONFIG.runner.baseSpeed;
    this.speedRatio = speedRange > 0
      ? clamp((this.speed - CONFIG.runner.baseSpeed) / speedRange, 0, 1)
      : 0;

    // Update animations
    this._updateAnimation(dt);

    // Sync mesh
    this.syncMeshPosition();
  }

  _updateAnimation(dt) {
    const targetX = (this.targetLane - 1) * this.laneWidth;

    // --- Run cycle (speed-responsive) ---
    // Faster arm/leg cycle at higher speeds
    const cycleSpeedMultiplier = 1 + this.speedRatio * 0.6;
    this.runCycle += dt * this.speed * 0.8 * cycleSpeedMultiplier;

    // --- Shoe glow pulse (speed-responsive) ---
    this.shoeGlowPulse += dt * (3 + this.speedRatio * 4);
    const baseGlow = 0.3 + this.speedRatio * 0.5;
    const pulseRange = 0.2 + this.speedRatio * 0.3;
    let glowIntensity = baseGlow + Math.sin(this.shoeGlowPulse) * pulseRange;

    // Celebration glow boost
    if (this.celebrateTimer > 0) {
      const celebrateProgress = this.celebrateTimer / this.celebrateDuration;
      glowIntensity += celebrateProgress * 1.2;
    }

    if (this.shoeMaterial) {
      this.shoeMaterial.emissiveIntensity = glowIntensity;
    }
    if (this.rightShoeMaterial) {
      this.rightShoeMaterial.emissiveIntensity = glowIntensity;
    }

    // --- Arm swing (running animation, speed-responsive) ---
    if (this.leftArm && this.rightArm) {
      // Wider swing at higher speeds
      const swingAmplitude = 0.5 + this.speedRatio * 0.35;

      if (this.celebrateTimer > 0) {
        // Celebration: arms go up
        const celebrateProgress = this.celebrateTimer / this.celebrateDuration;
        const armUp = -1.2 * easeOutCubic(1 - celebrateProgress);
        // Arms raise then come back down
        const armAngle = celebrateProgress > 0.3
          ? lerp(0, armUp, (celebrateProgress - 0.3) / 0.7 * -1 + 1)
          : lerp(armUp, 0, (0.3 - celebrateProgress) / 0.3);
        this.leftArm.rotation.x = armAngle;
        this.rightArm.rotation.x = armAngle;
        // Slight outward spread
        this.leftArm.rotation.z = celebrateProgress > 0.3
          ? lerp(0, 0.4, (1 - celebrateProgress) / 0.7)
          : lerp(0.4, 0, (0.3 - celebrateProgress) / 0.3);
        this.rightArm.rotation.z = -this.leftArm.rotation.z;
      } else if (this.isSliding) {
        // Arms back during slide
        this.leftArm.rotation.x = -0.8;
        this.rightArm.rotation.x = -0.8;
        this.leftArm.rotation.z = 0;
        this.rightArm.rotation.z = 0;
      } else {
        const swing = Math.sin(this.runCycle) * swingAmplitude;
        this.leftArm.rotation.x = swing;
        this.rightArm.rotation.x = -swing;
        // Reset z rotation when not celebrating
        this.leftArm.rotation.z = lerp(this.leftArm.rotation.z, 0, 10 * dt);
        this.rightArm.rotation.z = lerp(this.rightArm.rotation.z, 0, 10 * dt);
      }
    }

    // --- Shoe animation (running footstep) ---
    if (this.leftShoe && this.rightShoe && !this.isJumping) {
      const footLift = Math.abs(Math.sin(this.runCycle)) * 0.1;
      this.leftShoe.position.y = 0.06 + (Math.sin(this.runCycle) > 0 ? footLift : 0);
      this.rightShoe.position.y = 0.06 + (Math.sin(this.runCycle) < 0 ? footLift : 0);
    }

    // --- Landing squash/stretch (enhanced with impact timer) ---
    if (this.landImpactTimer > 0) {
      // Two-phase: squash down then stretch back with overshoot
      const impactProgress = 1 - (this.landImpactTimer / 0.25);

      if (impactProgress < 0.3) {
        // Phase 1: Heavy squash (first 30% of animation)
        const squashPhase = impactProgress / 0.3;
        const squashAmount = easeOutCubic(squashPhase);
        const squashY = 1 - 0.25 * squashAmount;
        const squashXZ = 1 + 0.15 * squashAmount;
        this.mesh.scale.set(squashXZ, squashY, squashXZ);
      } else {
        // Phase 2: Stretch recovery with elastic overshoot (remaining 70%)
        const stretchPhase = (impactProgress - 0.3) / 0.7;
        const elasticReturn = easeOutElastic(stretchPhase);
        const squashY = lerp(0.75, 1, elasticReturn);
        const squashXZ = lerp(1.15, 1, elasticReturn);
        this.mesh.scale.set(squashXZ, squashY, squashXZ);
      }
    } else if (this.landSquash > 0) {
      // Fallback: original simple squash decay
      this.landSquash -= dt * 3;
      const squashY = 1 - this.landSquash * 0.2;
      const squashXZ = 1 + this.landSquash * 0.1;
      this.mesh.scale.set(squashXZ, squashY, squashXZ);
    } else {
      this.mesh.scale.set(1, 1, 1);
    }

    // --- Slide pose ---
    if (this.isSliding) {
      this.mesh.scale.y = 0.5;
      this.mesh.position.y = this.y;
    }

    // --- Lean into turns ---
    // Lean proportional to distance from target lane position
    const laneOffset = targetX - this.x;
    this.targetLeanAngle = laneOffset * -0.15;
    // Clamp lean angle so it doesn't go crazy
    this.targetLeanAngle = clamp(this.targetLeanAngle, -0.25, 0.25);
    // Smooth interpolation toward target lean
    this.leanAngle = lerp(this.leanAngle, this.targetLeanAngle, 8 * dt);
    // Apply lean (but don't override stumble - stumble adds its own tilt)
    if (this.stumbleTimer <= 0) {
      this.mesh.rotation.z = this.leanAngle;
    }

    // --- Head bob ---
    if (this.head) {
      // Vertical bob synced to run cycle (double frequency for left-right footsteps)
      const bobFrequency = this.runCycle * 2;
      const bobAmplitude = this.isJumping ? 0 : (0.02 + this.speedRatio * 0.015);
      const headBob = Math.sin(bobFrequency) * bobAmplitude;
      this.head.position.y = this.headBaseY + headBob;

      // Look slightly toward the lane being switched to
      const headTurnTarget = laneOffset * -0.08;
      const currentHeadY = this.head.rotation.y || 0;
      this.head.rotation.y = lerp(currentHeadY, headTurnTarget, 6 * dt);

      // Hair follows head
      if (this.hair) {
        this.hair.position.y = this.head.position.y + 0.05;
        this.hair.rotation.y = this.head.rotation.y;
      }
    }

    // --- Celebration animation ---
    if (this.celebrateTimer > 0) {
      const progress = this.celebrateTimer / this.celebrateDuration;
      // Quick upward bounce that settles
      if (progress > 0.6) {
        // Rising phase
        const risePhase = (progress - 0.6) / 0.4;
        this.mesh.position.y += 0.3 * Math.sin(risePhase * Math.PI);
      } else {
        // Settling phase with slight bounce
        const settlePhase = 1 - (progress / 0.6);
        this.mesh.position.y += 0.15 * Math.sin(settlePhase * Math.PI) * progress * 2;
      }
      // Slight scale pulse (puff up with pride)
      const scalePulse = 1 + 0.05 * Math.sin(progress * Math.PI * 2);
      if (this.landImpactTimer <= 0 && !this.isSliding) {
        this.mesh.scale.x *= scalePulse;
        this.mesh.scale.z *= scalePulse;
      }
    }

    // --- Stumble animation ---
    if (this.stumbleTimer > 0) {
      const progress = this.stumbleTimer / this.stumbleDuration;
      // Lurch forward then recover
      if (progress > 0.5) {
        // Lurch forward (first half)
        const lurchPhase = (progress - 0.5) / 0.5;
        const lurchAngle = 0.35 * Math.sin(lurchPhase * Math.PI);
        this.mesh.rotation.x = lurchAngle;
        // Lean off-balance
        this.mesh.rotation.z = this.leanAngle + 0.1 * Math.sin(lurchPhase * Math.PI * 2);
      } else {
        // Recovery phase (second half) - elastic snap back
        const recoverPhase = 1 - (progress / 0.5);
        const recoverAngle = 0.35 * (1 - easeOutElastic(recoverPhase));
        this.mesh.rotation.x = recoverAngle;
        // Sway back to center
        this.mesh.rotation.z = lerp(this.leanAngle, 0, recoverPhase) + this.leanAngle;
      }
      // Shoes flicker during stumble
      if (this.shoeMaterial) {
        const flickerIntensity = glowIntensity * (0.5 + Math.random() * 0.5);
        this.shoeMaterial.emissiveIntensity = flickerIntensity;
      }
      if (this.rightShoeMaterial) {
        const flickerIntensity = glowIntensity * (0.5 + Math.random() * 0.5);
        this.rightShoeMaterial.emissiveIntensity = flickerIntensity;
      }
    } else {
      // When not stumbling, smoothly return rotation.x to 0
      if (Math.abs(this.mesh.rotation.x) > 0.001) {
        this.mesh.rotation.x = lerp(this.mesh.rotation.x, 0, 10 * dt);
      } else {
        this.mesh.rotation.x = 0;
      }
    }

    // --- Hit flash (blink when invincible) ---
    if (this.invincible) {
      this.hitFlash += dt;
      this.mesh.visible = Math.floor(this.hitFlash * 10) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }
  }

  // Trigger celebration animation - called on good decisions
  celebrate() {
    this.celebrateTimer = this.celebrateDuration;
  }

  // Trigger stumble animation - called on obstacle hits
  stumble() {
    this.stumbleTimer = this.stumbleDuration;
  }

  // Called when player hits an obstacle
  hit() {
    if (this.invincible) return false;
    this.invincible = true;
    this.invincibleTimer = 1.5;
    this.hitFlash = 0;
    // Trigger stumble on hit
    this.stumble();
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
    // Reset enhanced animation state
    this.leanAngle = 0;
    this.targetLeanAngle = 0;
    this.celebrateTimer = 0;
    this.stumbleTimer = 0;
    this.landImpactTimer = 0;
    this.speedRatio = 0;
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.scale.set(1, 1, 1);
  }
}
