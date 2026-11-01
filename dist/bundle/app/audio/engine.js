// Audio Synthesis and Sound Engine for GarageBand
class GarageBandAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.delayNode = null;
    this.distortionNode = null;
    this.analyser = null;
    this.isInitialized = false;

    // Effects settings
    this.effects = {
      reverb: 0.35,
      delay: 0.25,
      distortion: 0.0,
      filterCutoff: 12000,
      masterVolume: 0.85
    };

    // Tracks audio state
    this.activeVoices = new Map();
  }

  init() {
    if (this.isInitialized) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.effects.masterVolume, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;

    // Lowpass filter (EQ)
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(this.effects.filterCutoff, this.ctx.currentTime);

    // Reverb impulse response
    this.convolver = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(this.effects.reverb, this.ctx.currentTime);
    this.generateReverbImpulse(2.2, 2.0);

    // Delay node
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.32, this.ctx.currentTime);
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.delayWet = this.ctx.createGain();
    this.delayWet.gain.setValueAtTime(this.effects.delay, this.ctx.currentTime);

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);

    // Distortion / Overdrive
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(0);
    this.distortionNode.oversample = '4x';

    // Wiring up graph
    // Input -> Filter -> Distortion -> MasterGain -> Analyser -> Destination
    //                   \-> Convolver -> ReverbGain -> MasterGain
    //                   \-> DelayNode -> DelayWet  -> MasterGain
    this.filter.connect(this.distortionNode);
    this.distortionNode.connect(this.masterGain);

    this.distortionNode.connect(this.convolver);
    this.convolver.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    this.distortionNode.connect(this.delayNode);
    this.delayWet.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.effects.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.effects.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  setReverb(val) {
    this.effects.reverb = Math.max(0, Math.min(1, val));
    if (this.reverbGain && this.ctx) {
      this.reverbGain.gain.setTargetAtTime(this.effects.reverb, this.ctx.currentTime, 0.05);
    }
  }

  setDelay(val) {
    this.effects.delay = Math.max(0, Math.min(1, val));
    if (this.delayWet && this.ctx) {
      this.delayWet.gain.setTargetAtTime(this.effects.delay, this.ctx.currentTime, 0.05);
    }
  }

  setDistortion(amount) {
    this.effects.distortion = amount;
    if (this.distortionNode) {
      this.distortionNode.curve = this.makeDistortionCurve(amount * 50);
    }
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  generateReverbImpulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    this.convolver.buffer = impulse;
  }

  // Play realistic synthesized notes for different GarageBand instruments
  playNote(instrument, noteName, freq, duration = 1.2, velocity = 0.8) {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.connect(this.filter);

    if (instrument === 'piano') {
      // Grand Piano acoustic simulation: Fundamental + overtone harmonics + gentle hammer strike
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // 2nd harmonic

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3, now); // 3rd harmonic

      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      const g3 = this.ctx.createGain();
      g1.gain.value = 0.7;
      g2.gain.value = 0.25;
      g3.gain.value = 0.1;

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);

      g1.connect(voiceGain);
      g2.connect(voiceGain);
      g3.connect(voiceGain);

      // Piano ADSR envelope
      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(velocity * 0.9, now + 0.015); // sharp strike
      voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.5, now + 0.35); // sustain decay
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + duration);
      osc2.stop(now + duration);
      osc3.stop(now + duration);

    } else if (instrument === 'synth') {
      // Modern Poly Synth (Sawtooth + pulse + sweeping filter)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.006, now); // slight detune for richness

      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.4;
      osc1.connect(subGain);
      osc2.connect(subGain);

      const synthFilter = this.ctx.createBiquadFilter();
      synthFilter.type = 'lowpass';
      synthFilter.frequency.setValueAtTime(freq * 5, now);
      synthFilter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);

      subGain.connect(synthFilter);
      synthFilter.connect(voiceGain);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.04);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);

    } else if (instrument === 'guitar') {
      // Electric Guitar: Sawtooth + subtle vibrato + plucked envelope
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Vibrato LFO
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5, now); // 5Hz vibrato
      lfoGain.gain.setValueAtTime(2.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now + 0.2); // vibrato begins after initial pluck
      lfo.stop(now + duration);

      const guitarFilter = this.ctx.createBiquadFilter();
      guitarFilter.type = 'bandpass';
      guitarFilter.frequency.setValueAtTime(freq * 2.2, now);
      guitarFilter.Q.setValueAtTime(3, now);

      osc.connect(guitarFilter);
      guitarFilter.connect(voiceGain);

      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(velocity * 0.8, now + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.3, now + 0.4);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.start(now);
      osc.stop(now + duration);

    } else if (instrument === 'bass') {
      // Deep Punchy Bass
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq / 2, now); // octave lower

      const sub = this.ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(freq / 2, now);

      const bassGain = this.ctx.createGain();
      bassGain.gain.value = 0.5;
      osc.connect(bassGain);
      sub.connect(bassGain);
      bassGain.connect(voiceGain);

      voiceGain.gain.setValueAtTime(0, now);
      voiceGain.gain.linearRampToValueAtTime(velocity * 0.95, now + 0.02);
      voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.5, now + 0.3);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.start(now);
      sub.start(now);
      osc.stop(now + duration);
      sub.stop(now + duration);
    }
  }

  // Play Drum sound kit pieces (Kick, Snare, Hi-Hat, Tom, Clap, Crash)
  playDrum(type, velocity = 0.9) {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.filter);

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain.gain.setValueAtTime(velocity, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.35);

    } else if (type === 'snare') {
      // Noise burst + tone body
      const noiseBuffer = this.createNoiseBuffer(0.2);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(900, now);

      const tone = this.ctx.createOscillator();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(190, now);
      tone.frequency.exponentialRampToValueAtTime(70, now + 0.1);

      gain.gain.setValueAtTime(velocity * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(noiseFilter);
      noiseFilter.connect(gain);
      tone.connect(gain);

      noise.start(now);
      tone.start(now);
      noise.stop(now + 0.22);
      tone.stop(now + 0.22);

    } else if (type === 'hihat' || type === 'hihat-closed') {
      const noiseBuffer = this.createNoiseBuffer(0.06);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'highpass';
      bandpass.frequency.setValueAtTime(7500, now);

      gain.gain.setValueAtTime(velocity * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(bandpass);
      bandpass.connect(gain);

      noise.start(now);
      noise.stop(now + 0.06);

    } else if (type === 'clap') {
      // Multi-tap clap effect
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.015;
        const noiseBuffer = this.createNoiseBuffer(0.08);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const clapGain = this.ctx.createGain();
        clapGain.gain.setValueAtTime(velocity * (0.4 + i * 0.2), now + offset);
        clapGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);

        noise.connect(filter);
        filter.connect(clapGain);
        clapGain.connect(gain);

        noise.start(now + offset);
        noise.stop(now + offset + 0.12);
      }
    } else if (type === 'crash') {
      const noiseBuffer = this.createNoiseBuffer(1.4);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(4500, now);

      gain.gain.setValueAtTime(velocity * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      noise.connect(highpass);
      highpass.connect(gain);

      noise.start(now);
      noise.stop(now + 1.4);
    }
  }

  createNoiseBuffer(duration) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

// Export for window
window.GarageBandAudioEngine = GarageBandAudioEngine;
