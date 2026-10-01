/**
 * Audio Engine for Laptop Quest
 * Synthesizes sound effects via Web Audio API (zero external network latency)
 * and drives friendly speech directions via Web Speech API (SpeechSynthesis).
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.speechMuted = false;
    this.voice = null;
    this.voicePitch = 1.1; // Slightly friendly & warm
    this.voiceRate = 0.9;  // Slightly measured for 1st grader comprehension
    this.activeSpeechUtterance = null;
    this.onSpeechStartCallbacks = [];
    this.onSpeechEndCallbacks = [];
    this.initAudioContext();
    this.initSpeech();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureAudio() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initSpeech() {
    if ('speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Look for friendly English voices
        const preferred = voices.find(v => 
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Jenny') || v.name.includes('Victoria')) && v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        this.voice = preferred;
      };
      
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  playPop(freq = 480) {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playSparkle() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }, idx * 45);
    });
  }

  playClick() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playDoubleClickSuccess() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    this.playSparkle();
    setTimeout(() => {
      this.playChimeSuccess();
    }, 120);
  }

  playCrack() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.07);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playBonk() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  playBoing() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.12);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
  }

  playDrop() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  playChimeSuccess() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    // Major chord arpeggio
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((note, index) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      }, index * 80);
    });
  }

  playFanfare() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const notes = [
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 659.25, d: 350 }, // E5
      { f: 783.99, d: 250 }, // G5
      { f: 1046.50, d: 600 } // C6
    ];
    let offset = 0;
    notes.forEach((n) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (n.d / 1000));
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + (n.d / 1000) + 0.05);
      }, offset);
      offset += n.d;
    });
  }

  playGentleOof() {
    if (this.isMuted || !this.ctx) return;
    this.ensureAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * Speak instruction clearly
   * @param {string} text - text to speak
   * @param {object} options - onStart, onEnd callbacks
   */
  speak(text, { onStart = null, onEnd = null, onBoundary = null } = {}) {
    if (!('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 1500);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (this.speechMuted) {
      if (onEnd) setTimeout(onEnd, 1000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;

    utterance.onstart = () => {
      this.activeSpeechUtterance = utterance;
      if (onStart) onStart();
      this.onSpeechStartCallbacks.forEach(cb => cb(text));
    };

    utterance.onend = () => {
      this.activeSpeechUtterance = null;
      if (onEnd) onEnd();
      this.onSpeechEndCallbacks.forEach(cb => cb());
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error/interrupted', e);
      this.activeSpeechUtterance = null;
      if (onEnd) onEnd();
    };

    if (onBoundary) {
      utterance.onboundary = onBoundary;
    }

    // Workaround for Chrome speech synthesis pauses
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.activeSpeechUtterance = null;
      this.onSpeechEndCallbacks.forEach(cb => cb());
    }
  }

  isSpeaking() {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeech();
    }
  }
}

export const soundManager = new SoundSystem();
