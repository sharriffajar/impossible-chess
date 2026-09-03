/**
 * Impossible Chess - Synthesized Audio Engine (Web Audio API)
 */

export class ChessAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMove() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.07);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCheck() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [580, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (i * 0.09));
      gain.gain.setValueAtTime(0.25, now + (i * 0.09));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.09) + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (i * 0.09));
      osc.stop(now + (i * 0.09) + 0.12);
    });
  }

  playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 370, 311, 220].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + (i * 0.1));
      gain.gain.setValueAtTime(0.2, now + (i * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (i * 0.1));
      osc.stop(now + (i * 0.1) + 0.2);
    });
  }
}

export const sound = new ChessAudio();
