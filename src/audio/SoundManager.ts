import { AudioSettings } from '../types/game';

export class SoundManager {
  private static ctx: AudioContext | null = null;
  private static musicNode: OscillatorNode | null = null;
  private static musicGain: GainNode | null = null;
  private static isMusicPlaying = false;

  private static settings: AudioSettings = {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.4,
    isMuted: false,
    enableAmbientMusic: false,
  };

  /**
   * Initializes AudioContext on first user interaction to comply with browser autoplay policies
   */
  public static init(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public static setSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (this.settings.enableAmbientMusic && !this.isMusicPlaying) {
      this.startAmbientMusic();
    } else if (!this.settings.enableAmbientMusic && this.isMusicPlaying) {
      this.stopAmbientMusic();
    }
    if (this.musicGain && this.ctx) {
      const vol = this.settings.isMuted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
      this.musicGain.gain.setValueAtTime(vol * 0.15, this.ctx.currentTime);
    }
  }

  public static getSettings(): AudioSettings {
    return { ...this.settings };
  }

  private static getEffectiveSfxVolume(): number {
    if (this.settings.isMuted) return 0;
    return this.settings.masterVolume * this.settings.sfxVolume;
  }

  /**
   * Button click sound (Crisp metallic UI tap)
   */
  public static playClick(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  /**
   * Cell placement sound (Resonant futuristic chime tailored for X vs O)
   */
  public static playMove(isX: boolean): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isX ? 'triangle' : 'sine';
    subOsc.type = 'sine';

    const baseFreq = isX ? 587.33 : 440; // D5 vs A4
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    subOsc.frequency.setValueAtTime(baseFreq / 2, now);

    gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.2);
    subOsc.stop(now + 0.2);
  }

  /**
   * Invalid move / error buzzer
   */
  public static playInvalidMove(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.07);

    gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Power-up activation energy surge sound
   */
  public static playPowerUp(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

    gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Victory fanfare (Triumphant multi-chord synth arpeggio)
   */
  public static playVictory(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(this.getEffectiveSfxVolume() * 0.4, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
  }

  /**
   * Draw sound (Reflective atmospheric chime)
   */
  public static playDraw(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const now = this.ctx.currentTime;
    const notes = [440, 415.3, 392]; // A4, G#4, G4

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.25, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.35);
    });
  }

  /**
   * Achievement unlock shimmer chime
   */
  public static playAchievement(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const notes = [659.25, 783.99, 987.77, 1318.51];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.3, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.4);
    });
  }

  /**
   * Level up fanfare
   */
  public static playLevelUp(): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.35, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  /**
   * Time attack countdown tick
   */
  public static playTick(isUrgent: boolean = false): void {
    this.init();
    if (!this.ctx || this.getEffectiveSfxVolume() <= 0) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 440, now);

    gain.gain.setValueAtTime(this.getEffectiveSfxVolume() * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Continuous procedural ambient cyber-synth drone
   */
  public static startAmbientMusic(): void {
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;

    try {
      const now = this.ctx.currentTime;
      this.musicNode = this.ctx.createOscillator();
      this.musicGain = this.ctx.createGain();

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      this.musicNode.type = 'sawtooth';
      this.musicNode.frequency.setValueAtTime(110, now); // A2 deep drone

      const vol = this.settings.isMuted
        ? 0
        : this.settings.masterVolume * this.settings.musicVolume * 0.1;
      this.musicGain.gain.setValueAtTime(vol, now);

      this.musicNode.connect(filter);
      filter.connect(this.musicGain);
      this.musicGain.connect(this.ctx.destination);

      this.musicNode.start();
      this.isMusicPlaying = true;
    } catch {
      // AudioContext policy suppression gracefully handled
    }
  }

  public static stopAmbientMusic(): void {
    if (this.musicNode) {
      try {
        this.musicNode.stop();
        this.musicNode.disconnect();
      } catch {}
      this.musicNode = null;
    }
    this.isMusicPlaying = false;
  }
}
