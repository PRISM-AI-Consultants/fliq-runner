// Audio manager using Web Audio API
// Placeholder - will load actual audio files when provided

export class Audio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.buffers = {};
    this.currentMusic = null;
    this.initialized = false;
  }

  // Must be called from a user gesture (click/tap)
  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);

    this.initialized = true;
  }

  // Generate a simple procedural sound effect (no external files needed)
  playSfx(type) {
    if (!this.initialized) return;

    switch (type) {
      case 'coin':
        this._playTone(880, 0.08, 'sine', 0.3);
        this._playTone(1320, 0.08, 'sine', 0.2, 0.05);
        break;
      case 'flow_pickup':
        this._playTone(523, 0.15, 'sine', 0.4);
        this._playTone(659, 0.15, 'sine', 0.3, 0.08);
        this._playTone(784, 0.2, 'sine', 0.3, 0.15);
        break;
      case 'good_decision':
        this._playChord([523, 659, 784], 0.3, 0.3);
        break;
      case 'bad_decision':
        this._playTone(220, 0.3, 'sawtooth', 0.15);
        this._playTone(185, 0.3, 'sawtooth', 0.15, 0.1);
        break;
      case 'obstacle_hit':
        this._playNoise(0.15, 0.3);
        this._playTone(150, 0.2, 'square', 0.15);
        break;
      case 'jump':
        this._playSweep(300, 600, 0.12, 0.15);
        break;
      case 'slide':
        this._playSweep(400, 200, 0.15, 0.1);
        break;
      case 'level_complete':
        this._playChord([523, 659, 784], 0.2, 0.3);
        setTimeout(() => this._playChord([587, 740, 880], 0.2, 0.3), 200);
        setTimeout(() => this._playChord([659, 784, 1047], 0.4, 0.4), 400);
        break;
      case 'decision_appear':
        this._playTone(440, 0.1, 'sine', 0.2);
        this._playTone(554, 0.15, 'sine', 0.2, 0.08);
        break;
      case 'ui_select':
        this._playTone(660, 0.08, 'sine', 0.2);
        break;
    }
  }

  _playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration + 0.01);
  }

  _playChord(freqs, duration, volume = 0.2) {
    freqs.forEach(f => this._playTone(f, duration, 'sine', volume / freqs.length));
  }

  _playSweep(startFreq, endFreq, duration, volume = 0.2) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.01);
  }

  _playNoise(duration, volume = 0.2) {
    const bufferSize = this.ctx.sampleRate * duration;
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

  setMusicVolume(v) {
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  setSfxVolume(v) {
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }
}
