// UI Manager - handles all DOM overlays on top of the Three.js canvas
// All UI is HTML/CSS for accessibility and kid-friendly large touch targets

export class UIManager {
  constructor() {
    this.overlay = document.getElementById('ui-overlay');
    this.screens = {};
    this.activeScreen = null;
  }

  // Register a UI screen component
  register(name, screen) {
    this.screens[name] = screen;
  }

  // Show a screen (hides current)
  show(name) {
    if (this.activeScreen && this.screens[this.activeScreen]) {
      this.screens[this.activeScreen].hide();
    }
    this.activeScreen = name;
    if (this.screens[name]) {
      this.screens[name].show();
    }
  }

  // Hide current screen
  hideCurrent() {
    if (this.activeScreen && this.screens[this.activeScreen]) {
      this.screens[this.activeScreen].hide();
    }
    this.activeScreen = null;
  }

  // Create a DOM element helper
  static createElement(tag, className, parent, innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    if (parent) parent.appendChild(el);
    return el;
  }
}
