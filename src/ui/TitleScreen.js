// Title screen - first thing the player sees
// "FLIQ RUNNER" with warm golden glow, WealthWise Kids branding
// Large PLAY button (icon-based)

export class TitleScreen {
  constructor(overlay, onStart) {
    this.overlay = overlay;
    this.onStart = onStart;
    this.element = null;
    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'title-screen';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg, #0d0818 0%, #2d1b3e 40%, #3d2040 70%, #f5a06040 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 50;
    `;

    // WealthWise Kids brand
    const brand = document.createElement('div');
    brand.style.cssText = `
      font-size: 0.85rem; font-weight: 600;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 8px;
    `;
    brand.textContent = 'WealthWise Kids';
    this.element.appendChild(brand);

    // FLIQ RUNNER title
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 3.5rem; font-weight: 900;
      background: linear-gradient(135deg, #F5A623, #FFD700, #F5C542);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-shadow: none;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      filter: drop-shadow(0 2px 10px rgba(245,166,35,0.4));
    `;
    title.textContent = 'FLIQ RUNNER';
    this.element.appendChild(title);

    // Trademark
    const tm = document.createElement('div');
    tm.style.cssText = `
      font-size: 0.7rem; color: rgba(255,255,255,0.3);
      margin-bottom: 40px;
    `;
    tm.textContent = 'Carter & Olay Foundation';
    this.element.appendChild(tm);

    // City silhouette (simple CSS art)
    const cityline = document.createElement('div');
    cityline.style.cssText = `
      display: flex; align-items: flex-end; gap: 3px;
      margin-bottom: 40px; opacity: 0.3;
    `;
    [30, 50, 35, 65, 40, 55, 45, 60, 38, 48].forEach(h => {
      const b = document.createElement('div');
      b.style.cssText = `
        width: 12px; height: ${h}px;
        background: linear-gradient(180deg, rgba(245,197,66,0.6), rgba(245,166,35,0.2));
        border-radius: 2px 2px 0 0;
      `;
      cityline.appendChild(b);
    });
    this.element.appendChild(cityline);

    // Play button (large, icon-based)
    const playBtn = document.createElement('button');
    playBtn.style.cssText = `
      width: 100px; height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F5A623, #FFD700);
      border: 3px solid rgba(255,255,255,0.3);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem;
      color: #1a1020;
      box-shadow: 0 4px 20px rgba(245,166,35,0.4), 0 0 40px rgba(245,166,35,0.2);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    `;
    playBtn.innerHTML = '\u25B6'; // Play triangle
    playBtn.addEventListener('pointerenter', () => {
      playBtn.style.transform = 'scale(1.1)';
      playBtn.style.boxShadow = '0 4px 30px rgba(245,166,35,0.6), 0 0 60px rgba(245,166,35,0.3)';
    });
    playBtn.addEventListener('pointerleave', () => {
      playBtn.style.transform = 'scale(1)';
      playBtn.style.boxShadow = '0 4px 20px rgba(245,166,35,0.4), 0 0 40px rgba(245,166,35,0.2)';
    });
    playBtn.addEventListener('click', () => {
      if (this.onStart) this.onStart();
    });
    this.element.appendChild(playBtn);

    // Tap hint
    const hint = document.createElement('div');
    hint.style.cssText = `
      margin-top: 20px; font-size: 0.85rem;
      color: rgba(255,255,255,0.3);
      animation: pulse 2s ease infinite;
    `;
    hint.textContent = 'Tap to Play';
    this.element.appendChild(hint);

    // Pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes hudFlash {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes scoreReveal {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    this.overlay.appendChild(this.element);
  }

  show() {
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
