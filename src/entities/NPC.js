// NPC entities - characters on the sidewalk that the player can help
// Types: child, elder, friend, vendor
// Each has idle animation, help reaction, speech bubble, and proximity detection
import * as THREE from 'three';
import { Entity3D } from './Entity3D.js';

// ---------- NPC type definitions ----------
const NPC_TYPES = {
  child: {
    label: 'Child',
    description: 'Needs help carrying books',
    scale: 0.7,
    bodyColor: 0xff7043,    // warm orange
    shirtColor: 0xffab91,
    skinColor: 0x8d5524,
    hairColor: 0x2c1810,
    bubbleColor: 0xffee58,  // bright yellow
    iconType: 'book',       // icon above head
    helpRadius: 3.5,
  },
  elder: {
    label: 'Elder',
    description: 'Needs help crossing the street',
    scale: 0.95,
    bodyColor: 0x78909c,    // blue-grey
    shirtColor: 0x607d8b,
    skinColor: 0xa0764e,
    hairColor: 0xcccccc,
    bubbleColor: 0x80deea,  // light cyan
    iconType: 'heart',
    helpRadius: 4.0,
  },
  friend: {
    label: 'Friend',
    description: 'Wants to share or trade',
    scale: 0.85,
    bodyColor: 0x66bb6a,    // friendly green
    shirtColor: 0x43a047,
    skinColor: 0xc68642,
    hairColor: 0x1a0a00,
    bubbleColor: 0xa5d6a7,  // soft green
    iconType: 'star',
    helpRadius: 3.0,
  },
  vendor: {
    label: 'Vendor',
    description: 'Offers deals from a small stand',
    scale: 0.9,
    bodyColor: 0xffa726,    // amber
    shirtColor: 0xf57c00,
    skinColor: 0x6b4226,
    hairColor: 0x2c1810,
    bubbleColor: 0xffe082,  // soft gold
    iconType: 'coin',
    helpRadius: 3.5,
  },
};

// Shared low-poly geometries (created once, reused across all NPCs)
let _sharedGeo = null;
function getSharedGeometries() {
  if (_sharedGeo) return _sharedGeo;
  _sharedGeo = {
    body: new THREE.CapsuleGeometry(0.28, 0.55, 4, 6),
    head: new THREE.SphereGeometry(0.2, 6, 5),
    hair: new THREE.SphereGeometry(0.22, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    arm: new THREE.CapsuleGeometry(0.055, 0.28, 3, 4),
    shoe: new THREE.BoxGeometry(0.18, 0.1, 0.3),
    bubble: new THREE.SphereGeometry(0.15, 6, 5),
    // Icon shapes
    bookIcon: new THREE.BoxGeometry(0.12, 0.15, 0.04),
    heartIcon: new THREE.SphereGeometry(0.07, 5, 4),
    starIcon: new THREE.OctahedronGeometry(0.08, 0),
    coinIcon: new THREE.CylinderGeometry(0.07, 0.07, 0.03, 6),
    // Vendor stand
    standTop: new THREE.BoxGeometry(0.7, 0.05, 0.4),
    standLeg: new THREE.BoxGeometry(0.06, 0.4, 0.06),
    // Reaction particles
    particle: new THREE.SphereGeometry(0.04, 4, 3),
  };
  return _sharedGeo;
}

export class NPC extends Entity3D {
  /**
   * @param {string} type - One of: 'child', 'elder', 'friend', 'vendor'
   * @param {number} xOffset - Sidewalk offset from lane center (positive = right side of road)
   */
  constructor(type = 'child', xOffset = 2.5) {
    super();

    const def = NPC_TYPES[type];
    if (!def) throw new Error(`Unknown NPC type: ${type}`);

    this.npcType = type;
    this.typeDef = def;
    this.xOffset = xOffset;

    // Interaction state
    this.helped = false;
    this.ignored = false;
    this.helpRadius = def.helpRadius;
    this.interactable = true; // false once decision is made

    // Animation timers
    this.idleTime = 0;
    this.reactionTime = 0;
    this.isReacting = false;
    this.reactionPhase = 0; // 0=idle, 1=jump-up, 2=peak, 3=land
    this.bubbleBobTime = Math.random() * Math.PI * 2; // random phase offset

    // Reaction particles
    this.reactionParticles = [];

    // Collision / proximity dimensions
    this.width = 0.8 * def.scale;
    this.height = 1.5 * def.scale;
    this.depth = 0.8 * def.scale;

    // Build mesh
    this.mesh = this._buildMesh();
  }

  // ---- Mesh construction ----

  _buildMesh() {
    const group = new THREE.Group();
    const def = this.typeDef;
    const geo = getSharedGeometries();

    // -- Character body group (scaled by type) --
    const charGroup = new THREE.Group();
    charGroup.scale.setScalar(def.scale);

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: def.bodyColor,
      roughness: 0.65,
      metalness: 0.05,
    });
    const body = new THREE.Mesh(geo.body, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    charGroup.add(body);

    // Head
    const headMat = new THREE.MeshStandardMaterial({
      color: def.skinColor,
      roughness: 0.7,
    });
    const head = new THREE.Mesh(geo.head, headMat);
    head.position.y = 1.38;
    charGroup.add(head);
    this._head = head;

    // Hair
    const hairMat = new THREE.MeshStandardMaterial({
      color: def.hairColor,
      roughness: 0.9,
    });
    const hair = new THREE.Mesh(geo.hair, hairMat);
    hair.position.y = 1.42;
    charGroup.add(hair);

    // Arms - relaxed at sides (idle pose, not running)
    const armMat = new THREE.MeshStandardMaterial({
      color: def.shirtColor,
      roughness: 0.7,
    });
    const leftArm = new THREE.Mesh(geo.arm, armMat);
    leftArm.position.set(-0.35, 0.8, 0);
    leftArm.rotation.z = 0.15; // slightly angled out
    charGroup.add(leftArm);
    this._leftArm = leftArm;

    const rightArm = new THREE.Mesh(geo.arm, armMat.clone());
    rightArm.position.set(0.35, 0.8, 0);
    rightArm.rotation.z = -0.15;
    charGroup.add(rightArm);
    this._rightArm = rightArm;

    // Shoes - flat on ground, no glow (NPCs don't have the signature glow)
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.8,
    });
    const leftShoe = new THREE.Mesh(geo.shoe, shoeMat);
    leftShoe.position.set(-0.11, 0.05, 0.04);
    charGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(geo.shoe, shoeMat);
    rightShoe.position.set(0.11, 0.05, 0.04);
    charGroup.add(rightShoe);

    // Type-specific extras
    if (this.npcType === 'vendor') {
      this._addVendorStand(charGroup, geo);
    }
    if (this.npcType === 'child') {
      this._addBookStack(charGroup, geo);
    }

    group.add(charGroup);
    this._charGroup = charGroup;

    // -- Speech bubble (floats above head) --
    const bubbleGroup = this._createSpeechBubble(geo, def);
    // Position above head, accounting for type scale
    bubbleGroup.position.y = 1.75 * def.scale;
    group.add(bubbleGroup);
    this._bubbleGroup = bubbleGroup;

    // -- Prepare reaction particle pool --
    this._initReactionParticles(group, geo, def);

    return group;
  }

  _addVendorStand(parent, geo) {
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.8,
    });
    // Table top
    const top = new THREE.Mesh(geo.standTop, standMat);
    top.position.set(0.5, 0.5, 0);
    parent.add(top);
    // Two legs
    const leg1 = new THREE.Mesh(geo.standLeg, standMat);
    leg1.position.set(0.25, 0.25, 0.12);
    parent.add(leg1);
    const leg2 = new THREE.Mesh(geo.standLeg, standMat);
    leg2.position.set(0.75, 0.25, -0.12);
    parent.add(leg2);
  }

  _addBookStack(parent, geo) {
    const colors = [0xe53935, 0x1e88e5, 0x43a047];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.7,
      });
      const book = new THREE.Mesh(geo.bookIcon, mat);
      // Stack books beside the child, slightly in front
      book.position.set(0.3, 0.15 + i * 0.06, 0.15);
      book.scale.setScalar(1.8);
      parent.add(book);
    }
  }

  _createSpeechBubble(geo, def) {
    const bubbleGroup = new THREE.Group();

    // Main bubble sphere
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: def.bubbleColor,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const bubble = new THREE.Mesh(geo.bubble, bubbleMat);
    bubbleGroup.add(bubble);
    this._bubbleMat = bubbleMat;

    // Icon inside the bubble, based on type
    const iconMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
    });

    let icon;
    switch (def.iconType) {
      case 'book':
        icon = new THREE.Mesh(geo.bookIcon, iconMat);
        break;
      case 'heart':
        // Approximate heart with two small spheres merged visually
        icon = new THREE.Group();
        const h1 = new THREE.Mesh(geo.heartIcon, iconMat);
        h1.position.set(-0.04, 0.02, 0);
        icon.add(h1);
        const h2 = new THREE.Mesh(geo.heartIcon, iconMat);
        h2.position.set(0.04, 0.02, 0);
        icon.add(h2);
        const h3 = new THREE.Mesh(geo.heartIcon, iconMat);
        h3.position.set(0, -0.03, 0);
        h3.scale.set(1.2, 0.8, 1);
        icon.add(h3);
        break;
      case 'star':
        icon = new THREE.Mesh(geo.starIcon, iconMat);
        break;
      case 'coin':
        icon = new THREE.Mesh(geo.coinIcon, iconMat);
        icon.rotation.x = Math.PI / 2;
        break;
      default:
        icon = new THREE.Mesh(geo.starIcon, iconMat);
    }

    bubbleGroup.add(icon);
    this._bubbleIcon = icon;

    return bubbleGroup;
  }

  _initReactionParticles(parent, geo, def) {
    // Pre-allocate a pool of small particles for the happy reaction burst
    const count = 8;
    const mat = new THREE.MeshStandardMaterial({
      color: def.bubbleColor,
      emissive: def.bubbleColor,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 1,
    });

    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(geo.particle, mat);
      p.visible = false;
      parent.add(p);
      this.reactionParticles.push({
        mesh: p,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
      });
    }
  }

  // ---- Update loop ----

  update(dt) {
    if (!this.active) return;

    if (this.isReacting) {
      this._updateReaction(dt);
    } else {
      this._updateIdle(dt);
    }

    this._updateBubble(dt);
    this._updateReactionParticles(dt);
    this.syncMeshPosition();
  }

  _updateIdle(dt) {
    this.idleTime += dt;

    // Gentle vertical bob
    const bobAmount = 0.04;
    const bobSpeed = 1.8;
    const bob = Math.sin(this.idleTime * bobSpeed) * bobAmount;
    if (this._charGroup) {
      this._charGroup.position.y = bob;
    }

    // Slight arm sway
    const sway = Math.sin(this.idleTime * 1.2) * 0.08;
    if (this._leftArm) this._leftArm.rotation.z = 0.15 + sway;
    if (this._rightArm) this._rightArm.rotation.z = -0.15 - sway;

    // Subtle head turn
    if (this._head) {
      this._head.rotation.y = Math.sin(this.idleTime * 0.7) * 0.15;
    }
  }

  _updateBubble(dt) {
    if (!this._bubbleGroup) return;

    // Hide bubble once helped or ignored
    if (this.helped || this.ignored) {
      this._bubbleGroup.visible = false;
      return;
    }

    this.bubbleBobTime += dt * 2.5;

    // Bob up and down
    const bobY = Math.sin(this.bubbleBobTime) * 0.08;
    this._bubbleGroup.position.y = (1.75 * this.typeDef.scale) + bobY;

    // Gentle scale pulse to attract attention
    const pulse = 1 + Math.sin(this.bubbleBobTime * 1.3) * 0.1;
    this._bubbleGroup.scale.setScalar(pulse);

    // Rotate icon slowly
    if (this._bubbleIcon) {
      this._bubbleIcon.rotation.y += dt * 1.5;
    }
  }

  // ---- Help / Ignore ----

  /**
   * Called when the player makes a sharing/helping decision for this NPC.
   */
  triggerHelped() {
    if (!this.interactable) return;
    this.helped = true;
    this.interactable = false;
    this.isReacting = true;
    this.reactionTime = 0;
    this.reactionPhase = 1;
    this._spawnReactionBurst();
  }

  /**
   * Called when the player passes without helping.
   */
  triggerIgnored() {
    if (!this.interactable) return;
    this.ignored = true;
    this.interactable = false;
    // Subtle sad reaction - shrink slightly
    if (this._charGroup) {
      this._sadShrinkTimer = 0.5;
    }
  }

  // ---- Happy reaction animation (jump + burst) ----

  _updateReaction(dt) {
    this.reactionTime += dt;

    switch (this.reactionPhase) {
      case 1: {
        // Jump up
        const t = Math.min(this.reactionTime / 0.25, 1);
        const jumpHeight = 0.6;
        // Ease-out quad
        const eased = 1 - (1 - t) * (1 - t);
        if (this._charGroup) {
          this._charGroup.position.y = eased * jumpHeight;
        }
        // Arms raise
        if (this._leftArm) this._leftArm.rotation.z = 0.15 + eased * 1.2;
        if (this._rightArm) this._rightArm.rotation.z = -0.15 - eased * 1.2;
        if (t >= 1) {
          this.reactionTime = 0;
          this.reactionPhase = 2;
        }
        break;
      }
      case 2: {
        // Hold at peak briefly
        if (this.reactionTime > 0.15) {
          this.reactionTime = 0;
          this.reactionPhase = 3;
        }
        break;
      }
      case 3: {
        // Fall back down
        const t = Math.min(this.reactionTime / 0.2, 1);
        const eased = t * t; // ease-in
        if (this._charGroup) {
          this._charGroup.position.y = 0.6 * (1 - eased);
        }
        if (this._leftArm) this._leftArm.rotation.z = 0.15 + (1 - eased) * 1.2;
        if (this._rightArm) this._rightArm.rotation.z = -0.15 - (1 - eased) * 1.2;
        if (t >= 1) {
          this.reactionPhase = 0;
          this.isReacting = false;
          if (this._charGroup) this._charGroup.position.y = 0;
        }
        break;
      }
    }
  }

  _spawnReactionBurst() {
    const count = this.reactionParticles.length;
    for (let i = 0; i < count; i++) {
      const p = this.reactionParticles[i];
      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.0;
      p.vx = Math.cos(angle) * speed;
      p.vy = 2.0 + Math.random() * 1.5;
      p.vz = Math.sin(angle) * speed;
      p.life = 0.6 + Math.random() * 0.3;
      p.mesh.position.set(0, 1.2 * this.typeDef.scale, 0);
      p.mesh.visible = true;
      p.mesh.material.opacity = 1;
    }
  }

  _updateReactionParticles(dt) {
    for (const p of this.reactionParticles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy -= 5 * dt; // gravity
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      // Fade out
      p.mesh.material.opacity = Math.max(0, p.life / 0.6);
      if (p.life <= 0) {
        p.mesh.visible = false;
      }
    }
  }

  // ---- Sad reaction (ignored) ----

  updateIgnored(dt) {
    if (this._sadShrinkTimer !== undefined && this._sadShrinkTimer > 0) {
      this._sadShrinkTimer -= dt;
      const t = Math.max(0, this._sadShrinkTimer / 0.5);
      const s = 0.9 + t * 0.1; // shrink from 1.0 to 0.9
      if (this._charGroup) {
        this._charGroup.scale.setScalar(this.typeDef.scale * s);
      }
    }
  }

  // ---- Proximity check ----

  /**
   * Returns true if the given world position is within this NPC's help radius.
   * @param {number} px - Player world X
   * @param {number} pz - Player world Z
   */
  isInHelpRange(px, pz) {
    if (!this.interactable) return false;
    const dx = px - this.x;
    const dz = pz - this.z;
    return (dx * dx + dz * dz) <= (this.helpRadius * this.helpRadius);
  }

  /**
   * Returns squared distance to a point (for sorting/priority).
   */
  distanceSquaredTo(px, pz) {
    const dx = px - this.x;
    const dz = pz - this.z;
    return dx * dx + dz * dz;
  }

  // ---- Cleanup ----

  dispose() {
    this.reactionParticles.length = 0;
    super.dispose();
  }
}

// Re-export type definitions for external use (spawning, UI, etc.)
export { NPC_TYPES };
