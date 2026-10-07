'use client';

/**
 * SpatialAudioEngine — Web Audio API Binaural / Stereo Panning Engine
 * 
 * Provides directional acoustic haptic cues for bilateral rehabilitation:
 * - Left earphone buzz/ring: Triggered when left-side posture or limb is misaligned
 * - Right earphone buzz/ring: Triggered when right-side posture or limb is misaligned
 * - Stereo Panner Node: Directs audio 100% to Left (-1.0) or Right (+1.0) earphone
 */

export type AudioPanSide = 'left' | 'right' | 'center';

type PanChangeListener = (side: AudioPanSide) => void;

class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private listeners: Set<PanChangeListener> = new Set();
  private lastActiveSide: AudioPanSide = 'center';
  private lastBuzzTimeMs: number = 0;

  /**
   * Initialize or resume the browser AudioContext safely on user gesture
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  public subscribe(listener: PanChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifySide(side: AudioPanSide) {
    this.lastActiveSide = side;
    this.listeners.forEach((listener) => {
      try {
        listener(side);
      } catch {}
    });

    // Reset visual indicator back to center after 800ms
    setTimeout(() => {
      if (this.lastActiveSide === side) {
        this.lastActiveSide = 'center';
        this.listeners.forEach((l) => {
          try {
            l('center');
          } catch {}
        });
      }
    }, 850);
  }

  public getLastActiveSide(): AudioPanSide {
    return this.lastActiveSide;
  }

  /**
   * Play a distinct directional "Buzz" in the specified earphone.
   * - side = 'left'  -> 100% routed to Left earphone (pan = -1.0)
   * - side = 'right' -> 100% routed to Right earphone (pan = +1.0)
   * - side = 'center'-> Both earphones (pan = 0.0)
   * 
   * Acoustically engineered with dual modulated oscillators (150Hz + 80Hz)
   * in a rhythmic dual-pulse burst ("bzz-bzz") to give an unmistakable proprioceptive alert.
   */
  public playPostureBuzz(side: AudioPanSide, throttleMs = 1200): void {
    const nowMs = Date.now();
    if (nowMs - this.lastBuzzTimeMs < throttleMs) {
      return; // prevent spamming while user is actively adjusting posture
    }
    this.lastBuzzTimeMs = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;

    this.notifySide(side);

    const now = ctx.currentTime;
    const panValue = side === 'left' ? -1.0 : side === 'right' ? 1.0 : 0.0;

    let panner: StereoPannerNode | null = null;
    try {
      if (typeof ctx.createStereoPanner === 'function') {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(panValue, now);
      }
    } catch {
      panner = null;
    }

    // Two sharp buzz bursts: 110ms pulse -> 50ms pause -> 110ms pulse
    const pulses = 2;
    const pulseDuration = 0.11;
    const pulseGap = 0.05;

    for (let i = 0; i < pulses; i++) {
      const startTime = now + i * (pulseDuration + pulseGap);

      // Primary buzz oscillator (low sawtooth harmonic for tactile buzz sensation)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(155, startTime);
      osc1.frequency.exponentialRampToValueAtTime(125, startTime + pulseDuration);

      // Sub-harmonic oscillator for body resonance
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(78, startTime);

      // Amplitude envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + pulseDuration);

      // Audio graph wiring
      osc1.connect(gain);
      osc2.connect(gain);

      if (panner) {
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + pulseDuration);
      osc2.stop(startTime + pulseDuration);
    }
  }

  /**
   * Play a directional "Ring / Ping" tone in the specified earphone.
   * Higher frequency bell-like acoustic chime (587Hz + 880Hz).
   */
  public playPostureRing(side: AudioPanSide): void {
    const ctx = this.getContext();
    if (!ctx) return;

    this.notifySide(side);

    const now = ctx.currentTime;
    const panValue = side === 'left' ? -1.0 : side === 'right' ? 1.0 : 0.0;

    let panner: StereoPannerNode | null = null;
    try {
      if (typeof ctx.createStereoPanner === 'function') {
        panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(panValue, now);
      }
    } catch {
      panner = null;
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now); // A5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);

    if (panner) {
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      gain.connect(ctx.destination);
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  /**
   * Play an uplifting 4-note major arpeggio when a full repetition set is completed.
   */
  public playSuccessChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    frequencies.forEach((freq, idx) => {
      const noteStart = now + idx * 0.08;
      const duration = 0.32;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + duration);
    });
  }

  /**
   * Soft click / tick on repetition trigger
   */
  public playSoftTick(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.10, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const spatialAudio = new SpatialAudioEngine();
