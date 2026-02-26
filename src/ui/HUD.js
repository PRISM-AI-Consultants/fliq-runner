// Heads-Up Display - shows during gameplay
// Flow meter, coin counter, level progress, city restoration mini-skyline
// ALL icon-based, minimal text (for 6-year-olds)

export class HUD {
  constructor(overlay) {
    this.overlay = overlay;
    this.element = null;
    this.flowBar = null;
    this.coinCount = null;
    this.cityMini = null;
    this.levelName = null;
    this.levelNameTimer = 0;

    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'hud';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0;
      padding: 12px 16px;
      display: none;
      pointer-events: none;
      z-index: 20;
    `;

    // Top bar container
    const topBar = document.createElement('div');
    topBar.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      width: 100%;
    `;

    // Flow energy meter (left side - lightbulb icon + bar)
    const flowContainer = document.createElement('div');
    flowContainer.style.cssText = `
      display: flex; align-items: center; gap: 8px;
    `;

    // Lightbulb icon (SVG)
    const flowIcon = document.createElement('div');
    flowIcon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M12 3a6 6 0 0 0-4 10.5V17h8v-3.5A6 6 0 0 0 12 3z"
        stroke="#F5C542" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
    flowContainer.appendChild(flowIcon);

    // Flow bar
    const flowBarOuter = document.createElement('div');
    flowBarOuter.style.cssText = `
      width: 120px; height: 14px;
      background: rgba(0,0,0,0.5);
      border-radius: 7px;
      border: 1px solid rgba(245,197,66,0.3);
      overflow: hidden;
    `;
    this.flowBar = document.createElement('div');
    this.flowBar.style.cssText = `
      height: 100%; width: 10%;
      background: linear-gradient(90deg, #F5A623, #FFD700);
      border-radius: 7px;
      transition: width 0.3s ease;
      box-shadow: 0 0 8px rgba(245,166,35,0.5);
    `;
    flowBarOuter.appendChild(this.flowBar);
    flowContainer.appendChild(flowBarOuter);

    // Flow number
    this.flowNumber = document.createElement('span');
    this.flowNumber.style.cssText = `
      color: #FFD700; font-size: 14px; font-weight: 700;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      min-width: 32px;
    `;
    this.flowNumber.textContent = '0';
    flowContainer.appendChild(this.flowNumber);

    topBar.appendChild(flowContainer);

    // City restoration mini-skyline (center)
    this.cityMini = document.createElement('div');
    this.cityMini.style.cssText = `
      display: flex; align-items: flex-end; gap: 2px; height: 24px;
    `;
    // 8 building silhouettes that light up
    for (let i = 0; i < 8; i++) {
      const building = document.createElement('div');
      const h = 8 + Math.random() * 14;
      building.style.cssText = `
        width: 6px; height: ${h}px;
        background: rgba(100,100,100,0.4);
        border-radius: 1px 1px 0 0;
        transition: background 0.5s ease;
      `;
      building.dataset.index = i;
      this.cityMini.appendChild(building);
    }
    topBar.appendChild(this.cityMini);

    // Coin counter (right side)
    const coinContainer = document.createElement('div');
    coinContainer.style.cssText = `
      display: flex; align-items: center; gap: 6px;
    `;
    const coinIcon = document.createElement('div');
    coinIcon.style.cssText = `
      width: 18px; height: 18px;
      background: linear-gradient(135deg, #FFD700, #F5A623);
      border-radius: 50%;
      border: 2px solid #DAA520;
      box-shadow: 0 0 6px rgba(245,166,35,0.4);
    `;
    coinContainer.appendChild(coinIcon);
    this.coinCount = document.createElement('span');
    this.coinCount.style.cssText = `
      color: #FFD700; font-size: 16px; font-weight: 700;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    `;
    this.coinCount.textContent = '0';
    coinContainer.appendChild(this.coinCount);
    topBar.appendChild(coinContainer);

    this.element.appendChild(topBar);

    // Level name display (shows briefly at level start)
    this.levelName = document.createElement('div');
    this.levelName.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #FFD700; font-size: 2rem; font-weight: 800;
      text-shadow: 0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(245,166,35,0.3);
      opacity: 0; transition: opacity 0.5s ease;
      text-align: center;
      letter-spacing: 0.05em;
    `;
    this.element.appendChild(this.levelName);

    this.overlay.appendChild(this.element);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  // Update flow meter
  setFlow(current, max = 750) {
    const pct = Math.min((current / max) * 100, 100);
    this.flowBar.style.width = pct + '%';
    this.flowNumber.textContent = Math.floor(current);
  }

  // Update coin counter
  setCoins(count) {
    this.coinCount.textContent = count;
  }

  // Update city restoration mini-skyline
  setRestoration(ratio) {
    const buildings = this.cityMini.children;
    for (let i = 0; i < buildings.length; i++) {
      const threshold = i / buildings.length;
      if (ratio > threshold) {
        const brightness = Math.min((ratio - threshold) * 3, 1);
        buildings[i].style.background = `rgba(245, 197, 66, ${0.3 + brightness * 0.7})`;
        buildings[i].style.boxShadow = `0 0 ${brightness * 4}px rgba(245,166,35,${brightness * 0.5})`;
      } else {
        buildings[i].style.background = 'rgba(100,100,100,0.4)';
        buildings[i].style.boxShadow = 'none';
      }
    }
  }

  // Flash level name
  displayLevelName(name, subtitle = '') {
    this.levelName.innerHTML = name + (subtitle ? `<br><span style="font-size:1rem;opacity:0.7">${subtitle}</span>` : '');
    this.levelName.style.opacity = '1';
    setTimeout(() => {
      this.levelName.style.opacity = '0';
    }, 2500);
  }

  // Pending reward indicator (delayed gratification)
  showPendingReward(amount) {
    if (!this._pendingRewardEl) {
      this._pendingRewardEl = document.createElement('div');
      this._pendingRewardEl.style.cssText = `
        position: absolute; top: 50px; right: 16px;
        display: flex; align-items: center; gap: 6px;
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(245,197,66,0.5);
        border-radius: 12px;
        padding: 6px 12px;
        animation: hudPendingPulse 1.5s ease-in-out infinite;
      `;
      // Add animation keyframes if not already added
      if (!document.getElementById('hud-pending-style')) {
        const style = document.createElement('style');
        style.id = 'hud-pending-style';
        style.textContent = `
          @keyframes hudPendingPulse { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
          @keyframes hudFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        `;
        document.head.appendChild(style);
      }
      this.element.appendChild(this._pendingRewardEl);
    }
    this._pendingRewardEl.innerHTML = `
      <span style="font-size:16px;">⏳</span>
      <span style="color:#FFD700;font-size:13px;font-weight:700;">+${amount}</span>
    `;
    this._pendingRewardEl.style.display = 'flex';
  }

  hidePendingReward() {
    if (this._pendingRewardEl) {
      this._pendingRewardEl.style.display = 'none';
    }
  }

  flashPendingRewardSuccess() {
    this._flashPendingReward('#2ecc71', '✓');
  }

  flashPendingRewardFailed() {
    this._flashPendingReward('#e74c3c', '✗');
  }

  _flashPendingReward(color, symbol) {
    if (!this._pendingRewardEl) return;
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: absolute; top: 45px; right: 16px;
      color: ${color}; font-size: 24px; font-weight: 900;
      text-shadow: 0 0 10px ${color};
      animation: hudFlash 0.8s ease-out forwards;
      pointer-events: none;
    `;
    flash.textContent = symbol;
    this.element.appendChild(flash);
    setTimeout(() => flash.remove(), 800);
  }

  // Decision feedback flash
  flashDecision(isPositive) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: ${isPositive ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)'};
      pointer-events: none;
      animation: hudFlash 0.5s ease-out forwards;
    `;
    this.element.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }
}
