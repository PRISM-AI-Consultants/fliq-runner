// Decision UI overlay - shows choice cards when player enters a decision zone
// Icon-based (NO text required) for 6-year-olds
// Large touch targets for tablet play

export class DecisionUI {
  constructor(overlay) {
    this.overlay = overlay;
    this.element = null;
    this.visible = false;
    this.onChoice = null;
    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'decision-ui';
    this.element.style.cssText = `
      position: absolute; bottom: 20%; left: 0; right: 0;
      display: none;
      justify-content: center; gap: 40px;
      padding: 0 20px;
      z-index: 25;
      animation: slideUp 0.3s ease-out;
    `;

    // Option A card
    this.cardA = this._createCard('A');
    this.element.appendChild(this.cardA);

    // "OR" divider
    const orDiv = document.createElement('div');
    orDiv.style.cssText = `
      display: flex; align-items: center;
      color: rgba(255,255,255,0.5);
      font-size: 1.2rem; font-weight: 700;
    `;
    orDiv.textContent = 'OR';
    this.element.appendChild(orDiv);

    // Option B card
    this.cardB = this._createCard('B');
    this.element.appendChild(this.cardB);

    // Timer bar (non-stressful, just visual)
    this.timerBar = document.createElement('div');
    this.timerBar.style.cssText = `
      position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
      width: 200px; height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px; overflow: hidden;
    `;
    const timerFill = document.createElement('div');
    timerFill.style.cssText = `
      height: 100%; width: 100%;
      background: linear-gradient(90deg, #F5A623, #FFD700);
      border-radius: 2px;
      transition: width 0.1s linear;
    `;
    this.timerFill = timerFill;
    this.timerBar.appendChild(timerFill);
    this.element.appendChild(this.timerBar);

    this.overlay.appendChild(this.element);
  }

  _createCard(id) {
    const card = document.createElement('div');
    card.style.cssText = `
      width: 120px; height: 140px;
      background: rgba(20, 10, 30, 0.85);
      border: 2px solid rgba(245,197,66,0.3);
      border-radius: 16px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    `;

    // Icon placeholder
    const icon = document.createElement('div');
    icon.className = `decision-icon-${id}`;
    icon.style.cssText = `
      width: 60px; height: 60px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem;
      margin-bottom: 8px;
    `;
    card.appendChild(icon);
    card[`iconEl`] = icon;

    // Arrow indicator
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      font-size: 1.5rem; opacity: 0.6;
    `;
    arrow.textContent = id === 'A' ? '\u2190' : '\u2192'; // Left/right arrows
    card.appendChild(arrow);

    // Hover/touch effects
    card.addEventListener('pointerenter', () => {
      card.style.transform = 'scale(1.08)';
      card.style.borderColor = 'rgba(245,197,66,0.7)';
      card.style.boxShadow = '0 0 20px rgba(245,166,35,0.3)';
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = 'scale(1)';
      card.style.borderColor = 'rgba(245,197,66,0.3)';
      card.style.boxShadow = 'none';
    });

    // Click handler
    card.addEventListener('click', () => {
      if (this.onChoice) this.onChoice(id);
    });

    return card;
  }

  // Show decision with options
  showDecision(decision, onChoice) {
    this.onChoice = onChoice;
    this.visible = true;

    // Set icons based on decision data
    const iconMap = {
      toy: '\uD83E\uDDF8',
      piggybank: '\uD83D\uDC37',
      gamepad: '\uD83C\uDFAE',
      savingsjar: '\uD83C\uDFFA',
      smallcoin: '\uD83E\uDE99',
      chest: '\uD83D\uDCE6',
      candy: '\uD83C\uDF6C',
      flowseed: '\uD83C\uDF31',
      icecream: '\uD83C\uDF66',
      groceries: '\uD83D\uDED2',
      sneakers: '\uD83D\uDC5F',
      books: '\uD83D\uDCDA',
      keeprunning: '\uD83C\uDFC3',
      helphand: '\uD83E\uDD1D',
      drinkalone: '\uD83E\uDDC3',
      sharedrink: '\uD83E\uDD42',
      darkalley: '\uD83C\uDF11',
      safepath: '\u2600\uFE0F',
      grabeverything: '\uD83D\uDED2',
      selectcarefully: '\u2705',
    };

    const aIcon = this.cardA.iconEl;
    const bIcon = this.cardB.iconEl;

    aIcon.textContent = iconMap[decision.optionA.icon] || '\u2753';
    aIcon.style.background = `radial-gradient(circle, ${colorToHex(decision.optionA.glowColor)}40, transparent)`;

    bIcon.textContent = iconMap[decision.optionB.icon] || '\u2753';
    bIcon.style.background = `radial-gradient(circle, ${colorToHex(decision.optionB.glowColor)}40, transparent)`;

    // Color the card borders
    this.cardA.style.borderColor = colorToHex(decision.optionA.glowColor) + '60';
    this.cardB.style.borderColor = colorToHex(decision.optionB.glowColor) + '60';

    this.element.style.display = 'flex';
    this.timerFill.style.width = '100%';
  }

  // Update timer bar
  updateTimer(ratio) {
    this.timerFill.style.width = (ratio * 100) + '%';
  }

  hide() {
    this.visible = false;
    this.element.style.display = 'none';
    this.onChoice = null;
  }
}

function colorToHex(num) {
  return '#' + num.toString(16).padStart(6, '0');
}
