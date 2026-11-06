// Web Audio API ambient sound generator for focus sessions
// Runs 100% locally with zero external network audio files

class AudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private currentMode: 'rain' | 'whitenoise' | 'brownnoise' | 'lofi' | 'off' = 'off';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(mode: 'rain' | 'whitenoise' | 'brownnoise' | 'lofi', volume: number = 0.3) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentMode = mode;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (mode === 'whitenoise') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(1200, this.ctx.currentTime);

      whiteNoise.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      whiteNoise.start();
      this.noiseNode = whiteNoise;
    } else if (mode === 'brownnoise') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const brown = this.ctx.createBufferSource();
      brown.buffer = noiseBuffer;
      brown.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(450, this.ctx.currentTime);

      brown.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      brown.start();
      this.noiseNode = brown;
    } else if (mode === 'rain') {
      // Pink noise + modulated filter simulating raindrops on library window
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
      const rain = this.ctx.createBufferSource();
      rain.buffer = noiseBuffer;
      rain.loop = true;

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(900, this.ctx.currentTime);

      // Gentle modulation
      this.lfoNode = this.ctx.createOscillator();
      this.lfoNode.frequency.setValueAtTime(0.3, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
      this.lfoNode.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      this.lfoNode.start();

      rain.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      rain.start();
      this.noiseNode = rain;
    } else if (mode === 'lofi') {
      // Warm chord drone (F minor chord: F3, Ab3, C4, Eb4) with gentle detune
      const freqs = [174.61, 207.65, 261.63, 311.13];
      const merger = this.ctx.createGain();
      merger.gain.setValueAtTime(0.08, this.ctx.currentTime);

      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (idx % 2 === 0 ? 0.3 : -0.3), this.ctx.currentTime);
        osc.connect(merger);
        osc.start();
      });

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(500, this.ctx.currentTime);
      merger.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    }
  }

  setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  playChime() {
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  stop() {
    try {
      if (this.noiseNode && 'stop' in this.noiseNode) {
        (this.noiseNode as AudioScheduledSourceNode).stop();
      }
      if (this.lfoNode) {
        this.lfoNode.stop();
      }
    } catch {
      // Ignore cleanup error
    }
    this.noiseNode = null;
    this.filterNode = null;
    this.lfoNode = null;
    this.gainNode = null;
    this.currentMode = 'off';
  }

  getMode() {
    return this.currentMode;
  }
}

export const soundEngine = new AudioEngine();
