// Input handling - keyboard + touch/swipe for runner controls
// Ported from Max the Flying Chicken Input.js, adapted for 3-lane runner

export class Input {
  constructor() {
    this.keys = {};

    // Edge-triggered state
    this._leftWasDown = false;
    this._leftJustPressed = false;
    this._rightWasDown = false;
    this._rightJustPressed = false;
    this._jumpWasDown = false;
    this._jumpJustPressed = false;
    this._slideWasDown = false;
    this._slideJustPressed = false;

    // Touch/swipe state
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.swipeDirection = null; // 'left', 'right', 'up', 'down'
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchStartTime = 0;
    this._swipeThreshold = 30;
    this._swipeConsumed = false;

    // Keyboard listeners
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch listeners for swipe detection
    if (this.isMobile) {
      this.setupTouchControls();
    }

    // Pause (edge-triggered)
    this._pauseWasDown = false;
    this._pauseJustPressed = false;

    // Also support tap zones on mobile
    this._tapAction = null;
  }

  setupTouchControls() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this._touchStartX = touch.clientX;
      this._touchStartY = touch.clientY;
      this._touchStartTime = Date.now();
      this._swipeConsumed = false;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this._swipeConsumed) return;

      const touch = e.touches[0];
      const dx = touch.clientX - this._touchStartX;
      const dy = touch.clientY - this._touchStartY;

      // Check if swipe exceeds threshold
      if (Math.abs(dx) > this._swipeThreshold || Math.abs(dy) > this._swipeThreshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          this.swipeDirection = dy > 0 ? 'down' : 'up';
        }
        this._swipeConsumed = true;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      // Detect tap (short duration, no swipe)
      const elapsed = Date.now() - this._touchStartTime;
      if (!this._swipeConsumed && elapsed < 300) {
        // Tap detected - use as jump by default
        this.swipeDirection = 'up';
      }
    }, { passive: false });
  }

  // Call once per frame to compute edge-triggered inputs
  update() {
    // Left lane switch (edge-triggered)
    const leftDown = this.leftRaw;
    this._leftJustPressed = leftDown && !this._leftWasDown;
    this._leftWasDown = leftDown;

    // Right lane switch (edge-triggered)
    const rightDown = this.rightRaw;
    this._rightJustPressed = rightDown && !this._rightWasDown;
    this._rightWasDown = rightDown;

    // Jump (edge-triggered)
    const jumpDown = this.jumpRaw;
    this._jumpJustPressed = jumpDown && !this._jumpWasDown;
    this._jumpWasDown = jumpDown;

    // Slide (edge-triggered)
    const slideDown = this.slideRaw;
    this._slideJustPressed = slideDown && !this._slideWasDown;
    this._slideWasDown = slideDown;

    // Pause (edge-triggered)
    const pauseDown = this.keys['Escape'] || this.keys['KeyP'];
    this._pauseJustPressed = pauseDown && !this._pauseWasDown;
    this._pauseWasDown = pauseDown;

    // Process swipe as edge-triggered (consume after one frame)
    if (this.swipeDirection === 'left') {
      this._leftJustPressed = true;
      this.swipeDirection = null;
    } else if (this.swipeDirection === 'right') {
      this._rightJustPressed = true;
      this.swipeDirection = null;
    } else if (this.swipeDirection === 'up') {
      this._jumpJustPressed = true;
      this.swipeDirection = null;
    } else if (this.swipeDirection === 'down') {
      this._slideJustPressed = true;
      this.swipeDirection = null;
    }
  }

  // Raw key state
  get leftRaw() {
    return this.keys['ArrowLeft'] || this.keys['KeyA'];
  }
  get rightRaw() {
    return this.keys['ArrowRight'] || this.keys['KeyD'];
  }
  get jumpRaw() {
    return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'];
  }
  get slideRaw() {
    return this.keys['ArrowDown'] || this.keys['KeyS'];
  }

  // Edge-triggered (true only on first frame pressed)
  get leftPressed() { return this._leftJustPressed; }
  get rightPressed() { return this._rightJustPressed; }
  get jumpPressed() { return this._jumpJustPressed; }
  get slidePressed() { return this._slideJustPressed; }

  // Any action (for menu navigation / confirm)
  get anyPressed() {
    return this._jumpJustPressed || this.keys['Enter'] || this.keys['Space'];
  }

  // Pause (edge-triggered - true only on first frame)
  get pausePressed() {
    return this._pauseJustPressed;
  }
}
