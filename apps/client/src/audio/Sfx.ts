export class Sfx {
  private context: AudioContext | null = null;

  core(): void {
    this.tone(220, 0.07, 0.035, "square");
  }

  blast(): void {
    this.tone(90, 0.12, 0.05, "sawtooth");
  }

  warning(): void {
    this.tone(440, 0.08, 0.04, "square", 2);
  }

  victory(): void {
    this.tone(660, 0.10, 0.04, "square");
    window.setTimeout(() => this.tone(880, 0.16, 0.04, "square"), 90);
  }

  defeat(): void {
    this.tone(180, 0.18, 0.035, "sawtooth");
  }

  draw(): void {
    this.tone(320, 0.12, 0.03, "triangle");
  }

  private tone(
    frequency: number,
    durationSeconds: number,
    volume: number,
    type: OscillatorType,
    pulses = 1
  ): void {
    try {
      const context = this.context ??= new AudioContext();
      void context.resume();

      for (let pulse = 0; pulse < pulses; pulse++) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + pulse * (durationSeconds + 0.04);
        const end = start + durationSeconds;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.01);
      }
    } catch {
      // Audio is optional presentation. Browser policy or device failures never affect gameplay.
    }
  }
}
