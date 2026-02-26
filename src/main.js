// FLIQ Runner - Entry Point
// WealthWise Kids Financial Literacy Game
// Carter & Olay Foundation

import { Game } from './engine/Game.js';

// Wait for DOM
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas not found');
    return;
  }

  // Create game instance
  window.game = new Game(canvas);

  // Prevent context menu on canvas (for right-click on desktop)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Log for dev
  console.log('FLIQ Runner initialized');
  console.log('Controls: Arrow keys or WASD to move, Space to jump, Down to slide');
  console.log('Touch: Swipe left/right to switch lanes, swipe up to jump, swipe down to slide');
});
