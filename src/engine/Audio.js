// Audio.js - Dynamic layered music system + procedural SFX for FLIQ Runner
// 100% procedural using Web Audio API - zero audio files needed
// Music layers unlock progressively as city restoration increases (0-1)
// Designed for kids 6-10: warm, inviting, Pixar-esque feel

export class Audio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;

    // Music state
    this.musicPlaying = false;
    this.restorationLevel = 0;
    this.bpm = 100;
    this.beatDuration = 60 / 100; // seconds per beat
    this.barDuration = this.beatDuration * 4; // 4/4 time

    // Music layers
    this.layers = {
      base: { gain: null, nodes: [], active: false, targetVolume: 0 },
      rhythm: { gain: null, nodes: [], active: false, targetVolume: 0 },
      melody: { gain: null, nodes: [], active: false, targetVolume: 0 },
      harmony: { gain: null, nodes: [], active: false, targetVolume: 0 },
    };

    // Scheduling
    this._schedulerTimer = null;
    this._nextBeatTime = 0;
    this._currentBeat = 0;
    this._currentBar = 0;
    this._scheduleAheadTime = 0.2; // seconds to look ahead for scheduling
    this._schedulerInterval = 50; // ms between scheduler calls

    // Melody state
    this._melodyPattern = [];
    this._melodyNoteIndex = 0;
    this._generateMelodyPattern();

    // Harmony state
    this._chordIndex = 0;
    // I-V-vi-IV in C major
    this._chordProgressions = [
      [261.63, 329.63, 392.00],   // C major (I)
      [392.00, 493.88, 587.33],   // G major (V)
      [220.00, 261.63, 329.63],   // A minor (vi)
      [174.61, 220.00, 261.63],   // F major (IV)
    ];

    // Pentatonic scale (C major pentatonic) for melody
    this._pentatonic = [
      261.63,  // C4
      293.66,  // D4
      329.63,  // E4
      392.00,  // G4
      440.00,  // A4
      523.25,  // C5
      587.33,  // D5
      659.25,  // E5
    ];

    // Track active oscillators for cleanup
    this._activeOscillators = [];
    this._padOscillators = [];
    this._padFilterNode = null;
    this._padLfoNode = null;
  }

  // Must be called from a user gesture (click/tap)
  init() {
    if (this.initialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);

    // Music bus
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);

    // Create layer gains
    for (const key of Object.keys(this.layers)) {
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.connect(this.musicGain);
      this.layers[key].gain = g;
    }

    this.initialized = true;
  }

  // ========================================
  // MUSIC CONTROL
  // ========================================

  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    this.musicPlaying = true;

    this._nextBeatTime = this.ctx.currentTime + 0.1;
    this._currentBeat = 0;
    this._currentBar = 0;
    this._chordIndex = 0;
    this._melodyNoteIndex = 0;

    // Start the ambient pad (always on)
    this._startBasePad();

    // Start the scheduler loop
    this._schedulerTimer = setInterval(() => this._scheduler(), this._schedulerInterval);

    // Apply current restoration level
    this._updateLayerVolumes();
  }

  stopMusic() {
    if (!this.musicPlaying) return;
    this.musicPlaying = false;

    // Stop scheduler
    if (this._schedulerTimer) {
      clearInterval(this._schedulerTimer);
      this._schedulerTimer = null;
    }

    // Fade out all layers
    const now = this.ctx.currentTime;
    for (const key of Object.keys(this.layers)) {
      const layer = this.layers[key];
      if (layer.gain) {
        layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
        layer.gain.gain.linearRampToValueAtTime(0, now + 0.5);
      }
    }

    // Stop pad oscillators after fade
    setTimeout(() => this._stopBasePad(), 600);

    // Clean up any scheduled oscillators
    this._cleanupOscillators();
  }

  setRestorationLevel(level) {
    this.restorationLevel = Math.max(0, Math.min(1, level));
    if (this.musicPlaying) {
      this._updateLayerVolumes();
    }
  }

  setMusicTempo(bpm) {
    this.bpm = Math.max(60, Math.min(160, bpm));
    this.beatDuration = 60 / this.bpm;
    this.barDuration = this.beatDuration * 4;
  }

  setMusicVolume(v) {
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(
        this.musicGain.gain.value,
        this.ctx.currentTime
      );
      this.musicGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, v)),
        this.ctx.currentTime + 0.1
      );
    }
  }

  setSfxVolume(v) {
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(
        this.sfxGain.gain.value,
        this.ctx.currentTime
      );
      this.sfxGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(1, v)),
        this.ctx.currentTime + 0.1
      );
    }
  }

  // ========================================
  // MUSIC INTERNALS
  // ========================================

  _updateLayerVolumes() {
    const now = this.ctx.currentTime;
    const fadeTime = 0.5;
    const r = this.restorationLevel;

    // Base layer: always on when music is playing
    const baseVol = 0.7;
    this.layers.base.gain.gain.setValueAtTime(this.layers.base.gain.gain.value, now);
    this.layers.base.gain.gain.linearRampToValueAtTime(baseVol, now + fadeTime);

    // Rhythm layer: fades in from 0.25
    const rhythmVol = r >= 0.25 ? Math.min(1, (r - 0.25) / 0.15) * 0.5 : 0;
    this.layers.rhythm.gain.gain.setValueAtTime(this.layers.rhythm.gain.gain.value, now);
    this.layers.rhythm.gain.gain.linearRampToValueAtTime(rhythmVol, now + fadeTime);
    this.layers.rhythm.active = r >= 0.25;

    // Melody layer: fades in from 0.5
    const melodyVol = r >= 0.5 ? Math.min(1, (r - 0.5) / 0.15) * 0.45 : 0;
    this.layers.melody.gain.gain.setValueAtTime(this.layers.melody.gain.gain.value, now);
    this.layers.melody.gain.gain.linearRampToValueAtTime(melodyVol, now + fadeTime);
    this.layers.melody.active = r >= 0.5;

    // Harmony layer: fades in from 0.75
    const harmonyVol = r >= 0.75 ? Math.min(1, (r - 0.75) / 0.15) * 0.35 : 0;
    this.layers.harmony.gain.gain.setValueAtTime(this.layers.harmony.gain.gain.value, now);
    this.layers.harmony.gain.gain.linearRampToValueAtTime(harmonyVol, now + fadeTime);
    this.layers.harmony.active = r >= 0.75;
  }

  // --- Base Pad Layer ---
  // Warm ambient pad: detuned triangle waves forming a C major chord
  // with slow LFO filter sweep

  _startBasePad() {
    // Root frequencies: C3, E3, G3 (low, warm)
    const padFreqs = [130.81, 164.81, 196.00];
    const detuneCents = [0, -8, 5, 3, -5, 8]; // slight detuning for richness

    // Create a lowpass filter for warmth with LFO
    this._padFilterNode = this.ctx.createBiquadFilter();
    this._padFilterNode.type = 'lowpass';
    this._padFilterNode.frequency.value = 800;
    this._padFilterNode.Q.value = 1.5;
    this._padFilterNode.connect(this.layers.base.gain);

    // LFO to sweep the filter slowly
    this._padLfoNode = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this._padLfoNode.type = 'sine';
    this._padLfoNode.frequency.value = 0.08; // very slow sweep
    lfoGain.gain.value = 400; // sweep range: 800 +/- 400
    this._padLfoNode.connect(lfoGain);
    lfoGain.connect(this._padFilterNode.frequency);
    this._padLfoNode.start();
    this._padOscillators.push(this._padLfoNode);

    // Create oscillator pairs (detuned) for each frequency
    for (const freq of padFreqs) {
      for (let d = 0; d < 2; d++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = detuneCents[d] || 0;

        const oscGain = this.ctx.createGain();
        oscGain.gain.value = 0.12;

        osc.connect(oscGain);
        oscGain.connect(this._padFilterNode);
        osc.start();

        this._padOscillators.push(osc);
      }
    }
  }

  _stopBasePad() {
    for (const osc of this._padOscillators) {
      try { osc.stop(); } catch (_) { /* already stopped */ }
    }
    this._padOscillators = [];
    this._padFilterNode = null;
    this._padLfoNode = null;
  }

  // --- Scheduler ---
  // Runs on an interval, schedules events ahead of time

  _scheduler() {
    if (!this.musicPlaying || !this.ctx) return;

    while (this._nextBeatTime < this.ctx.currentTime + this._scheduleAheadTime) {
      this._scheduleBeat(this._nextBeatTime, this._currentBeat, this._currentBar);

      // Advance
      this._currentBeat++;
      if (this._currentBeat >= 4) {
        this._currentBeat = 0;
        this._currentBar++;
        if (this._currentBar >= 4) {
          this._currentBar = 0;
          // Re-randomize melody each 4-bar loop
          this._generateMelodyPattern();
          this._melodyNoteIndex = 0;
        }
      }

      this._nextBeatTime += this.beatDuration;
    }
  }

  _scheduleBeat(time, beat, bar) {
    // Rhythm layer
    if (this.layers.rhythm.active) {
      this._scheduleRhythm(time, beat);
    }

    // Melody layer - plays on each beat
    if (this.layers.melody.active) {
      this._scheduleMelody(time, beat, bar);
    }

    // Harmony layer - chord changes on beat 0 of each bar
    if (this.layers.harmony.active && beat === 0) {
      this._scheduleHarmony(time, bar);
    }
  }

  // --- Rhythm Layer ---
  // Soft percussive pattern: kick-like pulse + hi-hat ticks
  // Feels like a heartbeat coming alive

  _scheduleRhythm(time, beat) {
    // Kick-like pulse on beats 0 and 2
    if (beat === 0 || beat === 2) {
      this._scheduleKick(time);
    }

    // Hi-hat on every beat
    this._scheduleHiHat(time, beat % 2 === 0 ? 0.08 : 0.04);

    // Off-beat hi-hats (8th notes) for movement
    this._scheduleHiHat(time + this.beatDuration * 0.5, 0.03);
  }

  _scheduleKick(time) {
    // Kick: short sine sweep from 150Hz down to 50Hz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.08);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.layers.rhythm.gain);
    osc.start(time);
    osc.stop(time + 0.16);

    this._trackOscillator(osc, time + 0.16);
  }

  _scheduleHiHat(time, volume) {
    // Hi-hat: very short burst of filtered noise
    const duration = 0.04;
    const bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.layers.rhythm.gain);
    source.start(time);
  }

  // --- Melody Layer ---
  // Simple pentatonic melody, 4-bar loop, warm sine tones

  _generateMelodyPattern() {
    // Generate 16 notes (4 bars x 4 beats)
    // Mix of notes and rests for a child-friendly feel
    this._melodyPattern = [];
    const scale = this._pentatonic;

    // Create a pleasant, singable contour
    // Start low, rise through the phrase, gentle ending
    let lastIdx = Math.floor(Math.random() * 3); // start in lower register

    for (let i = 0; i < 16; i++) {
      // ~25% chance of rest for breathing room
      if (Math.random() < 0.25 && i > 0 && i < 15) {
        this._melodyPattern.push(null); // rest
        continue;
      }

      // Step motion with occasional leaps
      const leap = Math.random() < 0.2;
      const direction = i < 8 ? 1 : -1; // rise then fall
      const step = leap ? (Math.floor(Math.random() * 3) + 2) : (Math.random() < 0.5 ? 1 : -1);

      lastIdx = Math.max(0, Math.min(scale.length - 1, lastIdx + step * (Math.random() < 0.6 ? direction : -direction)));
      this._melodyPattern.push(scale[lastIdx]);
    }
  }

  _scheduleMelody(time, beat, bar) {
    const noteIdx = bar * 4 + beat;
    if (noteIdx >= this._melodyPattern.length) return;

    const freq = this._melodyPattern[noteIdx];
    if (freq === null) return; // rest

    const duration = this.beatDuration * 0.8; // slightly legato

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    // Warm filter on melody
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.7;

    // Gentle envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.03); // soft attack
    gain.gain.setValueAtTime(0.25, time + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // gentle release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.layers.melody.gain);
    osc.start(time);
    osc.stop(time + duration + 0.01);

    this._trackOscillator(osc, time + duration + 0.01);

    // Add a subtle octave-down reinforcement for warmth
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 0.5;

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.06, time + 0.04);
    gain2.gain.setValueAtTime(0.06, time + duration * 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc2.connect(filter);
    gain2.connect(this.layers.melody.gain);
    osc2.connect(gain2);
    osc2.start(time);
    osc2.stop(time + duration + 0.01);

    this._trackOscillator(osc2, time + duration + 0.01);
  }

  // --- Harmony Layer ---
  // Full chord progressions (I-V-vi-IV), celebratory feeling

  _scheduleHarmony(time, bar) {
    const chordIdx = bar % this._chordProgressions.length;
    const chord = this._chordProgressions[chordIdx];
    const duration = this.barDuration * 0.95;

    for (const freq of chord) {
      // Main tone
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Detuned double for richness
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq;
      osc2.detune.value = 6;

      // Warmth filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.5;

      // Envelope - swell in, sustain, gentle release
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.15); // soft swell
      gain.gain.setValueAtTime(0.12, time + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.layers.harmony.gain);

      osc.start(time);
      osc.stop(time + duration + 0.01);
      osc2.start(time);
      osc2.stop(time + duration + 0.01);

      this._trackOscillator(osc, time + duration + 0.01);
      this._trackOscillator(osc2, time + duration + 0.01);
    }
  }

  // --- Oscillator cleanup ---

  _trackOscillator(osc, endTime) {
    const entry = { osc, endTime };
    this._activeOscillators.push(entry);

    // Clean up old entries periodically
    if (this._activeOscillators.length > 50) {
      this._cleanupOscillators();
    }
  }

  _cleanupOscillators() {
    const now = this.ctx ? this.ctx.currentTime : Infinity;
    this._activeOscillators = this._activeOscillators.filter(entry => {
      if (entry.endTime < now) {
        return false; // already stopped, remove from tracking
      }
      return true;
    });
  }

  // ========================================
  // SFX
  // ========================================

  playSfx(type, options = {}) {
    if (!this.initialized) return;

    switch (type) {
      case 'coin':
        this._sfxCoin(options.combo || 0);
        break;
      case 'flow_pickup':
        this._sfxFlowPickup();
        break;
      case 'good_decision':
        this._sfxGoodDecision();
        break;
      case 'bad_decision':
        this._sfxBadDecision();
        break;
      case 'obstacle_hit':
        this._sfxObstacleHit();
        break;
      case 'jump':
        this._sfxJump();
        break;
      case 'slide':
        this._sfxSlide();
        break;
      case 'level_complete':
        this._sfxLevelComplete();
        break;
      case 'decision_appear':
        this._sfxDecisionAppear();
        break;
      case 'ui_select':
        this._sfxUiSelect();
        break;
      case 'combo_up':
        this._sfxComboUp();
        break;
      case 'combo_break':
        this._sfxComboBreak();
        break;
      case 'celebration':
        this._sfxCelebration();
        break;
    }
  }

  // --- Coin: Bright satisfying "ting", pitch rises with combo ---
  _sfxCoin(combo) {
    const baseFreq = 880;
    // Pitch rises with combo (up to +1 octave over 15 streak)
    const pitchBoost = Math.min(combo, 15) / 15;
    const freq1 = baseFreq * (1 + pitchBoost * 0.5);
    const freq2 = freq1 * 1.5; // perfect fifth up

    // Bright chime tone 1
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq1;
    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc1.connect(g1);
    g1.connect(this.sfxGain);
    osc1.start();
    osc1.stop(this.ctx.currentTime + 0.13);

    // Harmonic sparkle
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq2;
    const g2 = this.ctx.createGain();
    const t2 = this.ctx.currentTime + 0.03;
    g2.gain.setValueAtTime(0, this.ctx.currentTime);
    g2.gain.linearRampToValueAtTime(0.2, t2);
    g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.1);
    osc2.connect(g2);
    g2.connect(this.sfxGain);
    osc2.start();
    osc2.stop(t2 + 0.11);

    // High shimmer for combos > 5
    if (combo > 5) {
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = freq1 * 2;
      const g3 = this.ctx.createGain();
      g3.gain.setValueAtTime(0, this.ctx.currentTime);
      g3.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.02);
      g3.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc3.connect(g3);
      g3.connect(this.sfxGain);
      osc3.start();
      osc3.stop(this.ctx.currentTime + 0.16);
    }
  }

  // --- Flow Pickup: Warm ascending arpeggio with reverb-like decay ---
  _sfxFlowPickup() {
    const notes = [523.25, 659.25, 784.00, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const startTime = now + i * 0.06;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Warmth filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      filter.Q.value = 1;

      // Long decay for reverb-like tail
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.51);
    });

    // Subtle low reinforcement
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 261.63; // C4
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.1, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.61);
  }

  // --- Good Decision: Major chord with gentle chime ---
  _sfxGoodDecision() {
    const now = this.ctx.currentTime;
    // C major chord spread
    const chord = [523.25, 659.25, 784.00]; // C5, E5, G5

    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.setValueAtTime(0.2, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.46);
    });

    // Chime overtone
    const chime = this.ctx.createOscillator();
    chime.type = 'sine';
    chime.frequency.value = 1568; // G6
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0, now + 0.05);
    chimeGain.gain.linearRampToValueAtTime(0.1, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);
    chime.start(now + 0.05);
    chime.stop(now + 0.36);
  }

  // --- Bad Decision: Descending minor tone, brief ---
  _sfxBadDecision() {
    const now = this.ctx.currentTime;

    // Descending minor third
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(370, now); // F#4
    osc.frequency.exponentialRampToValueAtTime(277, now + 0.2); // C#4 (minor third down)

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);

    // Low undertone for weight
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 185;
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.1, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.connect(g2);
    g2.connect(this.sfxGain);
    osc2.start(now);
    osc2.stop(now + 0.21);
  }

  // --- Obstacle Hit: Impact thud with brief buzz ---
  _sfxObstacleHit() {
    const now = this.ctx.currentTime;

    // Impact thud - sine sweep down
    const thud = this.ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(200, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.35, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(now);
    thud.stop(now + 0.21);

    // Buzz component - filtered square wave
    const buzz = this.ctx.createOscillator();
    buzz.type = 'square';
    buzz.frequency.value = 80;
    const buzzFilter = this.ctx.createBiquadFilter();
    buzzFilter.type = 'lowpass';
    buzzFilter.frequency.value = 300;
    const buzzGain = this.ctx.createGain();
    buzzGain.gain.setValueAtTime(0.12, now);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    buzz.connect(buzzFilter);
    buzzFilter.connect(buzzGain);
    buzzGain.connect(this.sfxGain);
    buzz.start(now);
    buzz.stop(now + 0.11);

    // Noise burst for texture
    this._playNoise(0.08, 0.15);
  }

  // --- Jump: Quick ascending sweep ---
  _sfxJump() {
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Airy whoosh with filtered noise
    const dur = 0.1;
    const bufferSize = Math.ceil(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(1000, now);
    nFilter.frequency.exponentialRampToValueAtTime(4000, now + dur);
    nFilter.Q.value = 2;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.06, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(now);
  }

  // --- Slide: Quick descending sweep with whoosh ---
  _sfxSlide() {
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);

    // Friction noise
    const dur = 0.12;
    const bufferSize = Math.ceil(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.value = 2000;
    nFilter.Q.value = 3;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.05, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    src.start(now);
  }

  // --- Decision Appear: Two gentle ascending attention tones ---
  _sfxDecisionAppear() {
    const now = this.ctx.currentTime;

    // First tone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 587.33; // D5

    const g1 = this.ctx.createGain();
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.15, now + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(g1);
    g1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Second tone (a third up)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 739.99; // F#5
    const t2 = now + 0.1;

    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0, t2);
    g2.gain.linearRampToValueAtTime(0.18, t2 + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.2);

    osc2.connect(g2);
    g2.connect(this.sfxGain);
    osc2.start(t2);
    osc2.stop(t2 + 0.21);
  }

  // --- UI Select: Clean click ---
  _sfxUiSelect() {
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);

    // Subtle click transient
    const click = this.ctx.createOscillator();
    click.type = 'sine';
    click.frequency.value = 1760;
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.1, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    click.connect(cg);
    cg.connect(this.sfxGain);
    click.start(now);
    click.stop(now + 0.03);
  }

  // --- Combo Up: Ascending power-up sweep with sparkle ---
  _sfxComboUp() {
    const now = this.ctx.currentTime;

    // Rising sweep
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.31);

    // Sparkle harmonics
    const sparkleFreqs = [1568, 2093, 2637]; // G6, C7, E7
    sparkleFreqs.forEach((freq, i) => {
      const t = now + 0.12 + i * 0.04;
      const s = this.ctx.createOscillator();
      s.type = 'sine';
      s.frequency.value = freq;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0, t);
      sg.gain.linearRampToValueAtTime(0.08, t + 0.01);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      s.connect(sg);
      sg.connect(this.sfxGain);
      s.start(t);
      s.stop(t + 0.13);
    });

    // Fifth harmony for power feel
    const fifth = this.ctx.createOscillator();
    fifth.type = 'sine';
    fifth.frequency.setValueAtTime(600, now);
    fifth.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
    const fg = this.ctx.createGain();
    fg.gain.setValueAtTime(0.08, now);
    fg.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    fifth.connect(fg);
    fg.connect(this.sfxGain);
    fifth.start(now);
    fifth.stop(now + 0.26);
  }

  // --- Combo Break: Brief descending "womp" ---
  _sfxComboBreak() {
    const now = this.ctx.currentTime;

    // Descending womp
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.31);

    // Low sub for weight
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(200, now);
    sub.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.12, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    sub.connect(sg);
    sg.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.26);
  }

  // --- Celebration: Fanfare - ascending major scale with harmony ---
  _sfxCelebration() {
    const now = this.ctx.currentTime;
    // C major scale ascending with harmonized thirds
    const melody = [523.25, 587.33, 659.25, 698.46, 784.00, 880.00, 987.77, 1046.50];
    const thirds = [659.25, 739.99, 784.00, 880.00, 987.77, 1046.50, 1174.66, 1318.51];
    const noteLen = 0.08;

    melody.forEach((freq, i) => {
      const t = now + i * noteLen;

      // Melody note
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2, t + 0.01);
      g.gain.setValueAtTime(0.2, t + noteLen * 0.7);
      g.gain.exponentialRampToValueAtTime(0.001, t + noteLen + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + noteLen + 0.16);

      // Harmony (third above)
      const h = this.ctx.createOscillator();
      h.type = 'sine';
      h.frequency.value = thirds[i];
      const hg = this.ctx.createGain();
      hg.gain.setValueAtTime(0, t);
      hg.gain.linearRampToValueAtTime(0.1, t + 0.01);
      hg.gain.exponentialRampToValueAtTime(0.001, t + noteLen + 0.12);
      h.connect(hg);
      hg.connect(this.sfxGain);
      h.start(t);
      h.stop(t + noteLen + 0.13);
    });

    // Final chord - big C major
    const finalTime = now + melody.length * noteLen;
    const finalChord = [523.25, 659.25, 784.00, 1046.50];
    finalChord.forEach(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, finalTime);
      g.gain.linearRampToValueAtTime(0.2, finalTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, finalTime + 0.8);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(finalTime);
      osc.stop(finalTime + 0.81);
    });
  }

  // --- Level Complete: Grand triumphant fanfare ---
  _sfxLevelComplete() {
    const now = this.ctx.currentTime;

    // Three-part fanfare: da-da-DA!
    const phrases = [
      { time: 0, notes: [392.00, 493.88, 587.33], dur: 0.2 },       // G major
      { time: 0.25, notes: [440.00, 554.37, 659.25], dur: 0.2 },    // A major
      { time: 0.55, notes: [523.25, 659.25, 784.00, 1046.50], dur: 0.6 }, // C major (big)
    ];

    phrases.forEach(phrase => {
      const t = now + phrase.time;
      phrase.notes.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Doubled with triangle for richness
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = freq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        gain.gain.setValueAtTime(0.18, t + phrase.dur * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, t + phrase.dur);

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.08, t + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + phrase.dur);

        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.sfxGain);
        gain2.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + phrase.dur + 0.01);
        osc2.start(t);
        osc2.stop(t + phrase.dur + 0.01);
      });
    });

    // Sparkle trail on final chord
    for (let i = 0; i < 5; i++) {
      const t = now + 0.6 + i * 0.06;
      const freq = 1046.50 * (1 + i * 0.25); // ascending sparkles
      const s = this.ctx.createOscillator();
      s.type = 'sine';
      s.frequency.value = freq;
      const sg = this.ctx.createGain();
      sg.gain.setValueAtTime(0, t);
      sg.gain.linearRampToValueAtTime(0.06, t + 0.01);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      s.connect(sg);
      sg.connect(this.sfxGain);
      s.start(t);
      s.stop(t + 0.16);
    }
  }

  // ========================================
  // SHARED UTILITIES
  // ========================================

  _playNoise(duration, volume = 0.2) {
    const bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }
}
