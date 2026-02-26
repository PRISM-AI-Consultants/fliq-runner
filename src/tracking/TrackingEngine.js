// Central event tracking engine for FLIQ data collection
// Records every meaningful player action for FLIQ scoring
// Event-bus pattern: game systems emit events, trackers listen

import { uid } from '../utils/math.js';

export class TrackingEngine {
  constructor() {
    this.sessionId = uid();
    this.events = [];
    this.listeners = new Map();
    this.frameCount = 0;
    this.sessionStart = Date.now();
  }

  // Record an event
  record(event) {
    const stamped = {
      ...event,
      timestamp: Date.now(),
      sessionTime: Date.now() - this.sessionStart,
      frame: this.frameCount,
    };
    this.events.push(stamped);

    // Notify listeners
    const handlers = this.listeners.get(event.type) || [];
    handlers.forEach(fn => fn(stamped));
  }

  // Register a listener for an event type
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // Get all events of a type
  getEvents(type) {
    return this.events.filter(e => e.type === type);
  }

  // Update frame counter
  tick() {
    this.frameCount++;
  }

  // Export session data as JSON
  export() {
    return {
      sessionId: this.sessionId,
      startTime: new Date(this.sessionStart).toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - this.sessionStart,
      totalEvents: this.events.length,
      events: this.events,
    };
  }

  // Reset for new session
  reset() {
    this.sessionId = uid();
    this.events = [];
    this.frameCount = 0;
    this.sessionStart = Date.now();
  }
}
