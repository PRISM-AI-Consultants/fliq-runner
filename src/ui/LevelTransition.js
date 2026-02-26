// Between-level transition screen
// Shows city restoration progress and narrative text
// Placeholder for future MP4 cutscenes

export class LevelTransition {
  constructor(overlay) {
    this.overlay = overlay;
    this.element = null;
    this.onContinue = null;
    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'level-transition';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg, #0d0818, #1a1020);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 40;
      padding: 30px;
      text-align: center;
    `;

    // Level complete text
    this.completeText = document.createElement('div');
    this.completeText.style.cssText = `
      font-size: 1.5rem; font-weight: 800;
      color: #F5C542;
      text-shadow: 0 0 15px rgba(245,197,66,0.3);
      margin-bottom: 12px;
    `;
    this.element.appendChild(this.completeText);

    // Narrative text
    this.narrativeText = document.createElement('div');
    this.narrativeText.style.cssText = `
      font-size: 1rem;
      color: rgba(255,255,255,0.6);
      max-width: 400px;
      line-height: 1.6;
      margin-bottom: 24px;
    `;
    this.element.appendChild(this.narrativeText);

    // Flow earned
    this.flowEarned = document.createElement('div');
    this.flowEarned.style.cssText = `
      font-size: 1.2rem; font-weight: 700;
      color: #FFD700;
      margin-bottom: 30px;
    `;
    this.element.appendChild(this.flowEarned);

    // Continue button
    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 14px 40px;
      background: linear-gradient(135deg, #F5A623, #FFD700);
      border: none; border-radius: 30px;
      color: #1a1020;
      font-size: 1.1rem; font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(245,166,35,0.4);
      transition: transform 0.15s ease;
    `;
    btn.textContent = 'Keep Running!';
    btn.addEventListener('click', () => {
      if (this.onContinue) this.onContinue();
    });
    this.element.appendChild(btn);

    this.overlay.appendChild(this.element);
  }

  showTransition(levelNum, narrative, flowEarned, onContinue) {
    this.onContinue = onContinue;
    this.completeText.textContent = `Level ${levelNum} Complete!`;
    this.narrativeText.textContent = narrative;
    this.flowEarned.textContent = `+${flowEarned} Flow Energy`;
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
