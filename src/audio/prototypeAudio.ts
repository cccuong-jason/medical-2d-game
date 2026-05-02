export type PrototypeAudioMode = 'calm' | 'intense' | 'win' | 'lose';
export type PrototypeSfx =
  | 'footstep'
  | 'interaction'
  | 'faceCorrect'
  | 'faceWrong'
  | 'emergency'
  | 'callStart';

export const BACKGROUND_MUSIC_PATH = '/assets/audio/background_music.mp3';

type AudioContextFactory = typeof AudioContext;

const calmPattern = [261.63, 329.63, 392, 329.63];
const intensePattern = [196, 233.08, 261.63, 233.08];

function getAudioContextFactory(): AudioContextFactory | null {
  const globalAudio = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextFactory;
  };

  return globalAudio.AudioContext ?? globalAudio.webkitAudioContext ?? null;
}

function modePattern(mode: PrototypeAudioMode) {
  if (mode === 'intense') {
    return {
      gain: 0.035,
      intervalMs: 360,
      notes: intensePattern,
      wave: 'sawtooth' as OscillatorType
    };
  }

  return {
    gain: 0.025,
    intervalMs: 760,
    notes: calmPattern,
    wave: 'triangle' as OscillatorType
  };
}

function stingerForMode(mode: PrototypeAudioMode) {
  if (mode === 'win') {
    return [392, 523.25, 659.25];
  }

  if (mode === 'lose') {
    return [261.63, 220, 174.61];
  }

  return [];
}

export function getAudioModeForPhase(input: {
  phase: string;
  endingRating?: string | null;
}): PrototypeAudioMode {
  if (input.phase === 'ending') {
    return input.endingRating === 'critical' || input.endingRating === 'delayed'
      ? 'lose'
      : 'win';
  }

  if (
    input.phase === 'emergency' ||
    input.phase === 'minigame' ||
    input.phase === 'callEmergency' ||
    input.phase === 'resolution'
  ) {
    return 'intense';
  }

  return 'calm';
}

export class PrototypeAudio {
  private context: AudioContext | null = null;
  private enabled = true;
  private loopTimer: number | null = null;
  private music: HTMLAudioElement | null = null;
  private mode: PrototypeAudioMode = 'calm';
  private noteIndex = 0;

  unlock() {
    if (!this.enabled) {
      return;
    }

    const AudioContextCtor = getAudioContextFactory();
    if (AudioContextCtor) {
      try {
        this.context ??= new AudioContextCtor();
        void this.context.resume();
      } catch {
        this.context = null;
      }
    }

    this.ensureMusic();
    this.syncMusicForMode();
    this.startLoop();
  }

  setMode(mode: PrototypeAudioMode) {
    if (this.mode === mode) {
      return;
    }

    this.mode = mode;
    this.noteIndex = 0;
    this.syncMusicForMode();

    if (mode === 'win' || mode === 'lose') {
      this.stopLoop();
      this.playStinger(mode);
      return;
    }

    this.startLoop();
  }

  playSfx(kind: PrototypeSfx) {
    if (!this.context || !this.enabled) {
      return;
    }

    if (kind === 'footstep') {
      this.playTone(140, 0.04, 'square', 0.022);
      return;
    }

    if (kind === 'interaction') {
      this.playTone(523.25, 0.08, 'triangle', 0.035);
      return;
    }

    if (kind === 'faceCorrect') {
      this.playTone(659.25, 0.08, 'triangle', 0.04);
      window.setTimeout(() => this.playTone(783.99, 0.09, 'triangle', 0.035), 70);
      return;
    }

    if (kind === 'faceWrong') {
      this.playTone(146.83, 0.14, 'sawtooth', 0.035);
      return;
    }

    if (kind === 'emergency') {
      this.playTone(440, 0.11, 'sawtooth', 0.045);
      window.setTimeout(() => this.playTone(392, 0.16, 'sawtooth', 0.04), 100);
      return;
    }

    this.playTone(587.33, 0.09, 'square', 0.035);
    window.setTimeout(() => this.playTone(783.99, 0.12, 'square', 0.035), 90);
  }

  mute() {
    this.enabled = false;
    this.music?.pause();
    this.stopLoop();
  }

  private ensureMusic() {
    if (this.music || typeof Audio === 'undefined') {
      return;
    }

    this.music = new Audio(BACKGROUND_MUSIC_PATH);
    this.music.loop = true;
    this.music.preload = 'auto';
  }

  private syncMusicForMode() {
    if (!this.music || !this.enabled) {
      return;
    }

    if (this.mode === 'win' || this.mode === 'lose' || this.mode === 'intense') {
      this.music.pause();
      this.music.currentTime = 0;
      return;
    }

    this.music.volume = 0.18;
    void this.music.play().catch(() => {
      // Browsers can still deny media until the first gesture; the next unlock retries.
    });
  }

  private startLoop() {
    if (!this.context || !this.enabled || this.mode === 'win' || this.mode === 'lose') {
      return;
    }

    this.stopLoop();
    const pattern = modePattern(this.mode);

    this.loopTimer = window.setInterval(() => {
      const note = pattern.notes[this.noteIndex % pattern.notes.length];
      this.noteIndex += 1;
      this.playTone(note, 0.12, pattern.wave, pattern.gain);
    }, pattern.intervalMs);
  }

  private stopLoop() {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private playStinger(mode: PrototypeAudioMode) {
    const notes = stingerForMode(mode);

    notes.forEach((note, index) => {
      window.setTimeout(() => {
        this.playTone(note, 0.16, mode === 'win' ? 'triangle' : 'sawtooth', 0.045);
      }, index * 120);
    });
  }

  private playTone(
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    peakGain: number
  ) {
    if (!this.context || !this.enabled) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.02);
  }
}

export const prototypeAudio = new PrototypeAudio();
