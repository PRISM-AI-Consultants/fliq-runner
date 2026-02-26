// FLIQ Score reveal screen - end of session
// Animated score breakdown with dimension bars and badge
// Every child gets a positive framing - no "failing"

import { FLIQ_DIMENSIONS, FLIQ_LEVELS } from '../data/fliqWeights.js';

export class FLIQScoreScreen {
  constructor(overlay, onPlayAgain) {
    this.overlay = overlay;
    this.onPlayAgain = onPlayAgain;
    this.element = null;
    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'fliq-score';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg, #0d0818, #1a1020, #2d1b3e);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 20px;
      overflow-y: auto;
    `;
    this.overlay.appendChild(this.element);
  }

  showScore(fliqResult) {
    this.element.innerHTML = '';

    // Badge title
    const badge = this._getBadge(fliqResult.total);

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      text-align: center; margin-bottom: 24px;
      animation: scoreReveal 0.5s ease-out;
    `;

    const yourScore = document.createElement('div');
    yourScore.style.cssText = `
      font-size: 0.85rem; color: rgba(255,255,255,0.4);
      letter-spacing: 0.15em; text-transform: uppercase;
      margin-bottom: 8px;
    `;
    yourScore.textContent = 'Your FLIQ Score';
    header.appendChild(yourScore);

    // Big score number
    const scoreNum = document.createElement('div');
    scoreNum.style.cssText = `
      font-size: 4rem; font-weight: 900;
      background: linear-gradient(135deg, ${badge.color}, #FFD700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 2px 10px ${badge.color}60);
      line-height: 1;
    `;
    scoreNum.textContent = Math.round(fliqResult.total);
    header.appendChild(scoreNum);

    // Badge title
    const badgeTitle = document.createElement('div');
    badgeTitle.style.cssText = `
      font-size: 1.3rem; font-weight: 800;
      color: ${badge.color};
      text-shadow: 0 0 15px ${badge.color}40;
      margin-top: 8px;
    `;
    badgeTitle.textContent = badge.title;
    header.appendChild(badgeTitle);

    this.element.appendChild(header);

    // Dimension bars (animated sequentially)
    const dims = document.createElement('div');
    dims.style.cssText = `
      width: 100%; max-width: 350px;
      display: flex; flex-direction: column; gap: 12px;
    `;

    Object.entries(FLIQ_DIMENSIONS).forEach(([key, dim], i) => {
      const score = fliqResult.dimensions[key] || 0;
      const row = this._createDimensionBar(dim, score, i);
      dims.appendChild(row);
    });
    this.element.appendChild(dims);

    // Positive message
    const message = document.createElement('div');
    message.style.cssText = `
      margin-top: 24px; text-align: center;
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem; max-width: 300px;
      line-height: 1.5;
    `;
    message.textContent = this._getPositiveMessage(fliqResult);
    this.element.appendChild(message);

    // Play Again button
    const btn = document.createElement('button');
    btn.style.cssText = `
      margin-top: 24px;
      padding: 14px 40px;
      background: linear-gradient(135deg, #F5A623, #FFD700);
      border: none; border-radius: 30px;
      color: #1a1020;
      font-size: 1.1rem; font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(245,166,35,0.4);
      transition: transform 0.15s ease;
    `;
    btn.textContent = 'Run Again!';
    btn.addEventListener('pointerenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('pointerleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('click', () => {
      if (this.onPlayAgain) this.onPlayAgain();
    });
    this.element.appendChild(btn);

    this.element.style.display = 'flex';
  }

  _createDimensionBar(dim, score, index) {
    const row = document.createElement('div');
    row.style.cssText = `
      animation: slideUp 0.4s ease-out ${index * 0.1}s both;
    `;

    // Label
    const label = document.createElement('div');
    label.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 4px;
    `;

    const name = document.createElement('span');
    name.style.cssText = `
      font-size: 0.75rem; color: rgba(255,255,255,0.6);
      font-weight: 600;
    `;
    name.textContent = dim.label;
    label.appendChild(name);

    const scoreText = document.createElement('span');
    scoreText.style.cssText = `
      font-size: 0.75rem; color: #F5C542; font-weight: 700;
    `;
    scoreText.textContent = Math.round(score);
    label.appendChild(scoreText);

    row.appendChild(label);

    // Bar
    const barOuter = document.createElement('div');
    barOuter.style.cssText = `
      width: 100%; height: 8px;
      background: rgba(255,255,255,0.08);
      border-radius: 4px; overflow: hidden;
    `;
    const barFill = document.createElement('div');
    barFill.style.cssText = `
      height: 100%; width: 0%;
      background: linear-gradient(90deg, #F5A623, #FFD700);
      border-radius: 4px;
      transition: width 0.8s ease ${index * 0.15}s;
    `;
    barOuter.appendChild(barFill);
    row.appendChild(barOuter);

    // Animate fill after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barFill.style.width = score + '%';
      });
    });

    // Positive note if score is high
    if (score >= 70) {
      const note = document.createElement('div');
      note.style.cssText = `
        font-size: 0.65rem; color: #2ecc71;
        margin-top: 2px; font-weight: 600;
      `;
      note.textContent = dim.positiveTitle;
      row.appendChild(note);
    }

    return row;
  }

  _getBadge(score) {
    let badge = FLIQ_LEVELS[0];
    for (const level of FLIQ_LEVELS) {
      if (score >= level.minScore) badge = level;
    }
    return badge;
  }

  _getPositiveMessage(result) {
    const highest = Object.entries(result.dimensions)
      .sort((a, b) => b[1] - a[1])[0];
    const dim = FLIQ_DIMENSIONS[highest[0]];
    if (highest[1] >= 70) {
      return `Amazing job! You are a real ${dim.positiveTitle} Keep running to discover more about Velo City!`;
    }
    return `Great first run! Every choice helps you learn. Run again to discover new paths and grow your FLIQ score!`;
  }

  hide() {
    this.element.style.display = 'none';
  }
}
