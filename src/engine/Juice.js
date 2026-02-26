// Game Juice system - screen shake, FOV punch, speed lines, score popups,
// magnet trails, time slow, and flash effects. Makes every action feel incredible.
// All DOM effects render into the ui-overlay div on top of the Three.js canvas.
import * as THREE from 'three';
import { lerp, clamp } from '../utils/math.js';

export class Juice {
  constructor(camera, overlay) {
    this.camera = camera;
    this.overlay = overlay;

    // Screen shake state
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeRemaining = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // FOV punch state
    this.fovPunchAmount = 0;
    this.fovPunchDuration = 0;
    this.fovPunchRemaining = 0;

    // Time slow state
    this.timeScale = 1;
    this.timeSlowDuration = 0;
    this.timeSlowRemaining = 0;

    // Speed lines DOM element (created lazily, reused)
    this.speedLinesEl = null;
    this.speedLinesVisible = false;
    this.speedLinesIntensity = 0;

    // Active popup elements (tracked for cleanup)
    this.activePopups = [];

    // Active flash elements (tracked for cleanup)
    this.activeFlashes = [];

    // Magnet trail pool (reusable line objects in 3D)
    this.magnetTrails = [];

    // Reusable THREE.Vector3 for projection math
    this._projVec = new THREE.Vector3();

    // Inject the shared CSS keyframes once
    this._injectStyles();
  }

  // ---------------------------------------------------------------
  // Screen shake - camera offset that decays over time
  // ---------------------------------------------------------------

  shake(intensity = 0.3, duration = 0.15) {
    // Only override if the new shake is stronger than what remains
    if (intensity > this.shakeIntensity * (this.shakeRemaining / this.shakeDuration || 0)) {
      this.shakeIntensity = intensity;
      this.shakeDuration = duration;
      this.shakeRemaining = duration;
    }
  }

  getCameraOffset() {
    return { x: this.shakeOffsetX, y: this.shakeOffsetY };
  }

  // ---------------------------------------------------------------
  // FOV punch - briefly widen FOV for a sense of impact / speed
  // ---------------------------------------------------------------

  fovPunch(amount = 3, duration = 0.2) {
    this.fovPunchAmount = amount;
    this.fovPunchDuration = duration;
    this.fovPunchRemaining = duration;
  }

  getCurrentFOV(baseFOV) {
    if (this.fovPunchRemaining <= 0) return baseFOV;
    const t = this.fovPunchRemaining / this.fovPunchDuration;
    // Ease out - punch is strongest at start, eases to zero
    const eased = t * t;
    return baseFOV + this.fovPunchAmount * eased;
  }

  // ---------------------------------------------------------------
  // Speed lines - CSS overlay for sense of velocity
  // ---------------------------------------------------------------

  showSpeedLines(intensity) {
    const clamped = clamp(intensity, 0, 1);
    this.speedLinesIntensity = clamped;

    if (!this.speedLinesEl) {
      this.speedLinesEl = document.createElement('div');
      this.speedLinesEl.className = 'juice-speed-lines';
      this.speedLinesEl.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: repeating-conic-gradient(
          transparent 0deg, transparent 3deg,
          rgba(255, 255, 255, 0.03) 3deg, rgba(255, 255, 255, 0.03) 4deg
        );
        mask-image: radial-gradient(
          ellipse 40% 40% at 50% 50%,
          transparent 0%,
          black 70%
        );
        -webkit-mask-image: radial-gradient(
          ellipse 40% 40% at 50% 50%,
          transparent 0%,
          black 70%
        );
      `;
      this.overlay.appendChild(this.speedLinesEl);
    }

    this.speedLinesEl.style.opacity = String(clamped);

    // At higher intensities make the lines thicker/brighter
    const lineAlpha = 0.03 + clamped * 0.06;
    this.speedLinesEl.style.background = `repeating-conic-gradient(
      transparent 0deg, transparent 3deg,
      rgba(255, 255, 255, ${lineAlpha.toFixed(3)}) 3deg,
      rgba(255, 255, 255, ${lineAlpha.toFixed(3)}) 4deg
    )`;

    this.speedLinesVisible = true;
  }

  hideSpeedLines() {
    if (this.speedLinesEl) {
      this.speedLinesEl.style.opacity = '0';
    }
    this.speedLinesVisible = false;
    this.speedLinesIntensity = 0;
  }

  // ---------------------------------------------------------------
  // Score popup - "+15" text that floats up from a 3D world position
  // Projects 3D coords to screen space, creates animated DOM element
  // ---------------------------------------------------------------

  scorePopup(worldX, worldY, worldZ, text, color = '#f5c542', camera) {
    const cam = camera || this.camera;

    // Project 3D world position to normalized device coords
    this._projVec.set(worldX, worldY, worldZ);
    this._projVec.project(cam);

    // Discard if behind camera
    if (this._projVec.z > 1) return;

    // Convert NDC to screen pixels
    const screenX = (this._projVec.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-this._projVec.y * 0.5 + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'juice-score-popup';
    el.textContent = text;
    el.style.cssText = `
      position: absolute;
      left: ${screenX}px;
      top: ${screenY}px;
      transform: translate(-50%, -50%) scale(0.4);
      color: ${color};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-shadow:
        0 0 8px ${color},
        0 0 20px ${color}88,
        0 2px 4px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      z-index: 20;
      opacity: 1;
      animation: juicePopFloat 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
    `;

    this.overlay.appendChild(el);
    this.activePopups.push(el);

    // Auto-remove after animation completes
    const cleanup = () => {
      if (el.parentNode) el.parentNode.removeChild(el);
      const idx = this.activePopups.indexOf(el);
      if (idx !== -1) this.activePopups.splice(idx, 1);
    };

    el.addEventListener('animationend', cleanup, { once: true });
    // Safety fallback in case animationend does not fire
    setTimeout(cleanup, 1000);
  }

  // ---------------------------------------------------------------
  // Coin magnet visual - a brief pull-trail line in 3D space
  // Uses a simple Line object added to the camera's scene
  // ---------------------------------------------------------------

  magnetTrail(fromX, fromY, fromZ, toX, toY, toZ, color = 0xf5c542) {
    const lineColor = new THREE.Color(color);

    const points = [];
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Slight arc upward for visual interest
      const arcHeight = Math.sin(t * Math.PI) * 0.4;
      points.push(new THREE.Vector3(
        lerp(fromX, toX, t),
        lerp(fromY, toY, t) + arcHeight,
        lerp(fromZ, toZ, t)
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const line = new THREE.Line(geometry, material);

    // Find the scene by walking up from the camera
    const scene = this.camera.parent || this.camera;
    if (scene && scene.add) {
      scene.add(line);
    }

    const trail = {
      line,
      geometry,
      material,
      scene,
      life: 0.35,
      maxLife: 0.35,
    };

    this.magnetTrails.push(trail);
  }

  // ---------------------------------------------------------------
  // Time slow - brief slow-mo for big decision moments
  // ---------------------------------------------------------------

  timeSlowStart(duration = 0.5) {
    this.timeSlowDuration = duration;
    this.timeSlowRemaining = duration;
    this.timeScale = 0.3;
  }

  getTimeScale() {
    return this.timeScale;
  }

  // ---------------------------------------------------------------
  // Flash - brief full-screen color flash overlay
  // ---------------------------------------------------------------

  flash(color = '#f5c54240', duration = 0.2) {
    const el = document.createElement('div');
    el.className = 'juice-flash';
    el.style.cssText = `
      position: absolute;
      inset: 0;
      background: ${color};
      pointer-events: none;
      z-index: 15;
      opacity: 1;
      transition: opacity ${duration}s ease-out;
      will-change: opacity;
    `;

    this.overlay.appendChild(el);
    this.activeFlashes.push(el);

    // Trigger fade on next frame (after the browser paints the initial state)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.opacity = '0';
      });
    });

    const cleanup = () => {
      if (el.parentNode) el.parentNode.removeChild(el);
      const idx = this.activeFlashes.indexOf(el);
      if (idx !== -1) this.activeFlashes.splice(idx, 1);
    };

    el.addEventListener('transitionend', cleanup, { once: true });
    // Safety fallback
    setTimeout(cleanup, (duration + 0.1) * 1000);
  }

  // ---------------------------------------------------------------
  // Update - MUST be called every frame with delta time
  // ---------------------------------------------------------------

  update(dt) {
    // --- Screen shake decay ---
    if (this.shakeRemaining > 0) {
      this.shakeRemaining -= dt;
      const t = clamp(this.shakeRemaining / this.shakeDuration, 0, 1);
      const magnitude = this.shakeIntensity * t;
      this.shakeOffsetX = (Math.random() * 2 - 1) * magnitude;
      this.shakeOffsetY = (Math.random() * 2 - 1) * magnitude;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // --- FOV punch decay ---
    if (this.fovPunchRemaining > 0) {
      this.fovPunchRemaining -= dt;
      if (this.fovPunchRemaining < 0) this.fovPunchRemaining = 0;
    }

    // --- Time slow recovery ---
    if (this.timeSlowRemaining > 0) {
      this.timeSlowRemaining -= dt;
      if (this.timeSlowRemaining <= 0) {
        this.timeSlowRemaining = 0;
        this.timeScale = 1;
      } else {
        // Lerp from 0.3 back to 1.0 as the effect ends
        const progress = 1 - (this.timeSlowRemaining / this.timeSlowDuration);
        // Ease in - stay slow at first, then accelerate back to normal
        const eased = progress * progress;
        this.timeScale = lerp(0.3, 1.0, eased);
      }
    }

    // --- Magnet trails fade and cleanup ---
    for (let i = this.magnetTrails.length - 1; i >= 0; i--) {
      const trail = this.magnetTrails[i];
      trail.life -= dt;
      if (trail.life <= 0) {
        // Remove from scene and dispose
        if (trail.scene && trail.scene.remove) {
          trail.scene.remove(trail.line);
        }
        trail.geometry.dispose();
        trail.material.dispose();
        this.magnetTrails.splice(i, 1);
      } else {
        // Fade out
        const alpha = trail.life / trail.maxLife;
        trail.material.opacity = 0.7 * alpha;
      }
    }
  }

  // ---------------------------------------------------------------
  // Inject shared CSS keyframes into the document (once)
  // ---------------------------------------------------------------

  _injectStyles() {
    if (document.getElementById('juice-styles')) return;

    const style = document.createElement('style');
    style.id = 'juice-styles';
    style.textContent = `
      @keyframes juicePopFloat {
        0% {
          transform: translate(-50%, -50%) scale(0.4);
          opacity: 1;
        }
        15% {
          transform: translate(-50%, -50%) scale(1.3);
          opacity: 1;
        }
        30% {
          transform: translate(-50%, -70%) scale(1.0);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -180%) scale(0.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------
  // Cleanup - remove all DOM elements and Three.js objects
  // ---------------------------------------------------------------

  dispose() {
    // Remove speed lines
    if (this.speedLinesEl && this.speedLinesEl.parentNode) {
      this.speedLinesEl.parentNode.removeChild(this.speedLinesEl);
    }
    this.speedLinesEl = null;

    // Remove active popups
    for (const el of this.activePopups) {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    this.activePopups.length = 0;

    // Remove active flashes
    for (const el of this.activeFlashes) {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    this.activeFlashes.length = 0;

    // Remove magnet trails from scene
    for (const trail of this.magnetTrails) {
      if (trail.scene && trail.scene.remove) {
        trail.scene.remove(trail.line);
      }
      trail.geometry.dispose();
      trail.material.dispose();
    }
    this.magnetTrails.length = 0;

    // Remove injected styles
    const style = document.getElementById('juice-styles');
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }
}
