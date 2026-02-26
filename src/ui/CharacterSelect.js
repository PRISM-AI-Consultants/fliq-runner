// Character selection screen
// Placeholder silhouettes until Pixar-style assets arrive
// Icon-based, large touch targets

import { getAllCharacters } from '../data/characters.js';

export class CharacterSelect {
  constructor(overlay, onSelect) {
    this.overlay = overlay;
    this.onSelect = onSelect;
    this.element = null;
    this.selectedId = 'miller';
    this._build();
  }

  _build() {
    this.element = document.createElement('div');
    this.element.id = 'character-select';
    this.element.style.cssText = `
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(180deg, #0d0818 0%, #2d1b3e 60%, #3d2040 100%);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 45;
      padding: 20px;
    `;

    // Title
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 1.5rem; font-weight: 800;
      color: #F5C542;
      text-shadow: 0 0 10px rgba(245,197,66,0.3);
      margin-bottom: 8px;
      letter-spacing: 0.05em;
    `;
    title.textContent = 'Choose Your Runner';
    this.element.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = `
      font-size: 0.8rem; color: rgba(255,255,255,0.4);
      margin-bottom: 24px;
    `;
    subtitle.textContent = 'WealthWise Kids';
    this.element.appendChild(subtitle);

    // Character grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: flex; flex-wrap: wrap;
      gap: 16px; justify-content: center;
      max-width: 500px;
    `;

    const characters = getAllCharacters();
    characters.forEach(char => {
      const card = this._createCharCard(char);
      grid.appendChild(card);
    });
    this.element.appendChild(grid);

    // GO button
    const goBtn = document.createElement('button');
    goBtn.style.cssText = `
      margin-top: 24px;
      padding: 14px 48px;
      background: linear-gradient(135deg, #F5A623, #FFD700);
      border: none;
      border-radius: 30px;
      color: #1a1020;
      font-size: 1.2rem;
      font-weight: 800;
      cursor: pointer;
      letter-spacing: 0.1em;
      box-shadow: 0 4px 15px rgba(245,166,35,0.4);
      transition: transform 0.15s ease;
    `;
    goBtn.textContent = 'GO!';
    goBtn.addEventListener('pointerenter', () => goBtn.style.transform = 'scale(1.05)');
    goBtn.addEventListener('pointerleave', () => goBtn.style.transform = 'scale(1)');
    goBtn.addEventListener('click', () => {
      if (this.onSelect) this.onSelect(this.selectedId);
    });
    this.element.appendChild(goBtn);

    this.overlay.appendChild(this.element);
  }

  _createCharCard(char) {
    const card = document.createElement('div');
    const colorHex = '#' + char.bodyColor.toString(16).padStart(6, '0');
    card.style.cssText = `
      width: 80px; height: 100px;
      background: rgba(20,10,30,0.8);
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      cursor: pointer;
      transition: border-color 0.15s ease, transform 0.15s ease;
    `;

    // Silhouette circle
    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 44px; height: 44px;
      border-radius: 50%;
      background: ${colorHex};
      opacity: 0.8;
      margin-bottom: 6px;
      box-shadow: 0 0 10px ${colorHex}40;
    `;
    card.appendChild(avatar);

    // Name
    const name = document.createElement('div');
    name.style.cssText = `
      font-size: 0.7rem; font-weight: 700;
      color: rgba(255,255,255,0.7);
    `;
    name.textContent = char.name;
    card.appendChild(name);

    // Selection behavior
    card.addEventListener('click', () => {
      this.selectedId = char.id;
      // Update visual selection
      const allCards = this.element.querySelectorAll('#character-select > div:nth-child(3) > div');
      allCards.forEach(c => {
        c.style.borderColor = 'rgba(255,255,255,0.1)';
        c.style.transform = 'scale(1)';
      });
      card.style.borderColor = '#F5C542';
      card.style.transform = 'scale(1.05)';
    });

    // Default selection
    if (char.id === 'miller') {
      card.style.borderColor = '#F5C542';
    }

    return card;
  }

  show() {
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
