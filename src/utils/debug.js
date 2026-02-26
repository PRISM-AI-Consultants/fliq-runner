// Debug utilities - toggled via CONFIG.debugMode
import { CONFIG } from '../config.js';

let fpsFrames = 0;
let fpsTime = 0;
let fpsDisplay = 0;

export function updateFPS(dt) {
  if (!CONFIG.debugMode) return;
  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 1) {
    fpsDisplay = fpsFrames;
    fpsFrames = 0;
    fpsTime = 0;
  }
}

export function getFPS() {
  return fpsDisplay;
}

export function createDebugPanel() {
  if (!CONFIG.debugMode) return null;

  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.cssText = `
    position: fixed; top: 8px; right: 8px;
    background: rgba(0,0,0,0.7); color: #0f0;
    font: 12px monospace; padding: 8px;
    border-radius: 4px; z-index: 1000;
    pointer-events: none;
  `;
  document.body.appendChild(panel);
  return panel;
}

export function updateDebugPanel(panel, data) {
  if (!panel || !CONFIG.debugMode) return;
  panel.innerHTML = Object.entries(data)
    .map(([key, val]) => `${key}: ${val}`)
    .join('<br>');
}
