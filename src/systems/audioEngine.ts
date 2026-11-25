import { GameSettings } from '../types/game';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private engineRunning = false;

  private musicTimer: number | null = null;
  private musicMode: 'none' | 'menu' | 'gameplay' = 'none';
  private stepIdx = 0;

  private settings: GameSettings = {
    muted: false,
    sfxVolume: 0.75,
    musicVolume: 0.45,
    graphicsQuality: 'high',
    touchControls: 'auto',
    touchSwapped: false,
    touchScale: 'normal',
    touchVerticalOffset: 1,
    touchSideOffset: 0,
    touchPadLayout: 'ergo',
    hudAlertMode: 'compact',
  };

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyVolumes();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public updateSettings(next: GameSettings): void {
    this.settings = { ...next };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.settings.muted ? 0 : 1, now, 0.03);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.03);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume * 0.4, now, 0.05);
  }

  public startEngine(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.engineRunning) return;

    this.engineOsc = this.ctx.createOscillator();
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineSubOsc.type = 'triangle';
    this.engineOsc.frequency.value = 55;
    this.engineSubOsc.frequency.value = 27.5;

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 220;
    this.engineFilter.Q.value = 3.2;

    this.engineGain.gain.value = 0.08;

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
    this.engineRunning = true;
  }

  public updateEngine(speedRatio: number, nosActive: boolean, paused: boolean): void {
    if (!this.ctx || !this.engineRunning || !this.engineOsc || !this.engineSubOsc || !this.engineFilter || !this.engineGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (paused) {
      this.engineGain.gain.setTargetAtTime(0.0, now, 0.05);
      return;
    }
    const baseFreq = 46 + speedRatio * 95 + (nosActive ? 38 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.06);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.06);
    this.engineFilter.frequency.setTargetAtTime(190 + speedRatio * 680 + (nosActive ? 520 : 0), now, 0.06);
    this.engineGain.gain.setTargetAtTime(0.05 + speedRatio * 0.075 + (nosActive ? 0.04 : 0), now, 0.06);
  }

  public stopEngine(): void {
    if (!this.engineRunning) return;
    try {
      this.engineOsc?.stop();
      this.engineSubOsc?.stop();
      this.engineOsc?.disconnect();
      this.engineSubOsc?.disconnect();
      this.engineFilter?.disconnect();
      this.engineGain?.disconnect();
    } catch {
      // ignore
    }
    this.engineOsc = null;
    this.engineSubOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.engineRunning = false;
  }

  public setMusicMode(mode: 'none' | 'menu' | 'gameplay'): void {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (mode === 'none') return;

    this.stepIdx = 0;
    const intervalMs = mode === 'gameplay' ? 140 : 260;
    this.musicTimer = window.setInterval(() => {
      this.playMusicStep();
    }, intervalMs);
  }

  private playMusicStep(): void {
    if (!this.ctx || !this.musicGain || this.ctx.state !== 'running' || this.settings.muted) return;

    const now = this.ctx.currentTime;
    const step = this.stepIdx++ % 16;

    if (this.musicMode === 'menu') {
      // Moody Indonesian street night synth pulse
      const bassNotes = [55, 55, 65.41, 49, 55, 55, 73.42, 65.41];
      if (step % 2 === 0) {
        const freq = bassNotes[(step / 2) % bassNotes.length];
        this.triggerNote(freq, 0.22, 'sawtooth', 0.18, 320, this.musicGain, now);
      }
      if (step === 0 || step === 6 || step === 12) {
        const padNotes = [220, 261.63, 329.63, 293.66];
        const freq = padNotes[(step / 6) % padNotes.length];
        this.triggerNote(freq, 0.4, 'triangle', 0.08, 900, this.musicGain, now);
      }
    } else if (this.musicMode === 'gameplay') {
      // Driving arcade chase bassline + hi-hat pulse
      const bassPattern = [55, 55, 110, 55, 65.41, 55, 73.42, 82.41, 55, 55, 110, 55, 49, 65.41, 73.42, 98];
      const freq = bassPattern[step];
      this.triggerNote(freq, 0.11, 'sawtooth', 0.22, 620, this.musicGain, now);

      if (step % 4 === 0) {
        // Kick punch
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(125, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.11);
      }
      if (step % 2 === 1) {
        // Crisp hat tick
        this.triggerNoise(0.03, 5500, 'highpass', 0.06, this.musicGain, now);
      }
    }
  }

  private triggerNote(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    cutoff: number,
    dest: AudioNode,
    time: number
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private triggerNoise(
    duration: number,
    freq: number,
    filterType: BiquadFilterType,
    volume: number,
    dest: AudioNode,
    time: number
  ): void {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
  }

  public playNos(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.45, 900, 'bandpass', 0.35, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.28);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.34);
  }

  public playJump(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playAttack(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.14, 1800, 'bandpass', 0.3, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playImpact(heavy = false): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(heavy ? 0.28 : 0.16, heavy ? 520 : 950, 'lowpass', heavy ? 0.5 : 0.32, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(heavy ? 110 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + (heavy ? 0.24 : 0.12));
    g.gain.setValueAtTime(heavy ? 0.35 : 0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.26 : 0.14));
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (heavy ? 0.28 : 0.15));
  }

  public playEmp(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.42);
    g.gain.setValueAtTime(0.36, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playCoin(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(880, 0.08, 'sine', 0.18, 4000, this.sfxGain, now);
    this.triggerNote(1318.5, 0.14, 'sine', 0.18, 4000, this.sfxGain, now + 0.055);
  }

  public playHornTaunt(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(415, 0.11, 'sawtooth', 0.22, 2200, this.sfxGain, now);
    this.triggerNote(415, 0.18, 'sawtooth', 0.22, 2200, this.sfxGain, now + 0.14);
  }

  public playBossSiren(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(720, now + 0.28);
    osc.frequency.linearRampToValueAtTime(320, now + 0.56);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.62);
  }

  public playUiClick(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(660, 0.05, 'triangle', 0.12, 3000, this.sfxGain, now);
  }

  public playShoot(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.09, 2400, 'bandpass', 0.28, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.11);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playShotgun(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.22, 650, 'lowpass', 0.48, this.sfxGain, now);
    this.triggerNote(110, 0.15, 'sawtooth', 0.3, 450, this.sfxGain, now);
  }

  public playSmg(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.045, 3200, 'bandpass', 0.24, this.sfxGain, now);
    this.triggerNote(520, 0.05, 'square', 0.14, 1800, this.sfxGain, now);
  }

  public playRocketLaunch(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.32, 1100, 'bandpass', 0.38, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.25);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.29);
  }

  public playExplosion(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.45, 360, 'lowpass', 0.65, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.38);
    g.gain.setValueAtTime(0.48, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playKatanaSlash(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.14, 4200, 'highpass', 0.32, this.sfxGain, now);
    this.triggerNote(980, 0.08, 'sine', 0.2, 5000, this.sfxGain, now);
    this.triggerNote(1480, 0.1, 'triangle', 0.16, 6000, this.sfxGain, now + 0.03);
  }

  public playAmmoPickup(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(440, 0.06, 'square', 0.15, 2200, this.sfxGain, now);
    this.triggerNote(660, 0.08, 'triangle', 0.2, 3200, this.sfxGain, now + 0.055);
    this.triggerNote(990, 0.12, 'sine', 0.22, 4200, this.sfxGain, now + 0.11);
  }

  public playEmptyClip(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.03, 3800, 'highpass', 0.22, this.sfxGain, now);
    this.triggerNote(210, 0.04, 'triangle', 0.12, 1200, this.sfxGain, now);
  }

  public playEnemyShot(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.11, 1500, 'bandpass', 0.34, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(115, now + 0.12);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playBarricadeCrash(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.32, 420, 'lowpass', 0.55, this.sfxGain, now);
    this.triggerNote(95, 0.22, 'sawtooth', 0.36, 480, this.sfxGain, now);
    this.triggerNote(64, 0.28, 'square', 0.28, 320, this.sfxGain, now + 0.06);
  }

  public playParkingWhistle(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Authentic Indonesian Tukang Parkir double whistle chirp ("prit-priiit!")
    this.triggerNote(2450, 0.09, 'sine', 0.16, 4800, this.sfxGain, now);
    this.triggerNote(2620, 0.22, 'sine', 0.18, 5000, this.sfxGain, now + 0.12);
    this.triggerNote(2380, 0.12, 'triangle', 0.08, 4500, this.sfxGain, now + 0.15);
  }

  public playBikeBell(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(1980, 0.14, 'sine', 0.14, 5200, this.sfxGain, now);
    this.triggerNote(2040, 0.16, 'sine', 0.14, 5200, this.sfxGain, now + 0.11);
  }

  public playTrapDrop(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(240, 0.08, 'triangle', 0.24, 1400, this.sfxGain, now);
    this.triggerNote(160, 0.12, 'sawtooth', 0.2, 900, this.sfxGain, now + 0.05);
  }

  public playDash(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.18, 1400, 'highpass', 0.25, this.sfxGain, now);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playPickup(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(523.25, 0.08, 'triangle', 0.2, 3500, this.sfxGain, now);
    this.triggerNote(659.25, 0.08, 'triangle', 0.2, 3500, this.sfxGain, now + 0.06);
    this.triggerNote(1046.5, 0.16, 'sine', 0.22, 4200, this.sfxGain, now + 0.12);
  }

  public playNearMiss(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.12, 2200, 'bandpass', 0.22, this.sfxGain, now);
    this.triggerNote(987.77, 0.1, 'sine', 0.18, 4000, this.sfxGain, now + 0.03);
  }

  public playParry(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNoise(0.14, 3200, 'bandpass', 0.35, this.sfxGain, now);
    this.triggerNote(784, 0.09, 'triangle', 0.26, 4200, this.sfxGain, now);
    this.triggerNote(1567.98, 0.18, 'sine', 0.24, 5200, this.sfxGain, now + 0.04);
  }

  public playSponsorChime(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    this.triggerNote(220, 0.45, 'triangle', 0.14, 1200, this.sfxGain, now);
    this.triggerNote(329.63, 0.48, 'sine', 0.12, 2200, this.sfxGain, now + 0.06);
    this.triggerNote(440, 0.55, 'sine', 0.14, 2800, this.sfxGain, now + 0.12);
  }

  public playTeloletHorn(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 440.0, 523.25, 440.0, 523.25, 659.25];
    const times = [0, 0.11, 0.22, 0.34, 0.45, 0.57];
    for (let i = 0; i < notes.length; i++) {
      this.triggerNote(notes[i], 0.1, 'sawtooth', 0.22, 2600, this.sfxGain, now + times[i]);
    }
  }

  public playGhostChime(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(587.33, 0.35, 'sine', 0.18, 3500, this.sfxGain, now);
    this.triggerNote(880.0, 0.45, 'sine', 0.16, 4000, this.sfxGain, now + 0.1);
    this.triggerNote(1174.66, 0.55, 'triangle', 0.14, 4200, this.sfxGain, now + 0.2);
  }

  public playSecretUnlock(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const seq = [523.25, 659.25, 783.99, 1046.5];
    seq.forEach((f, idx) => {
      this.triggerNote(f, 0.14, 'triangle', 0.22, 4200, this.sfxGain!, now + idx * 0.07);
    });
  }

  public playCivilianSaved(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.triggerNote(587.33, 0.1, 'sine', 0.2, 4000, this.sfxGain, now);
    this.triggerNote(880.0, 0.16, 'triangle', 0.24, 4400, this.sfxGain, now + 0.08);
    this.triggerNote(1174.66, 0.24, 'sine', 0.22, 4800, this.sfxGain, now + 0.16);
  }

  public playCapStamped(isEgois: boolean): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    if (isEgois) {
      this.triggerNoise(0.18, 600, 'lowpass', 0.32, this.sfxGain, now);
      this.triggerNote(155.56, 0.16, 'sawtooth', 0.26, 900, this.sfxGain, now);
      this.triggerNote(110.0, 0.28, 'sawtooth', 0.28, 700, this.sfxGain, now + 0.12);
    } else {
      this.triggerNote(659.25, 0.12, 'triangle', 0.22, 4200, this.sfxGain, now);
      this.triggerNote(987.77, 0.22, 'sine', 0.24, 4600, this.sfxGain, now + 0.09);
    }
  }

  public playPoliceSiren(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.56;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.linearRampToValueAtTime(920, t + 0.28);
      osc.frequency.linearRampToValueAtTime(580, t + 0.54);
      g.gain.setValueAtTime(0.24, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.56);
    }
  }
}

export const audioEngine = new AudioEngine();
