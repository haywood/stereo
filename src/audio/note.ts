import { quantumSize } from './constants';

export type Analysis = {
  power: number;
  dpower: number;
};

const NO_AUDIO: Analysis = {
  power: 0,
  dpower: 0
};

const { round, abs, log2, min, max } = Math;

const memory = round(sampleRate / quantumSize / 200); // enough for ~5ms of audio
const dbMin = -130;
const dbMax = 0;

export class Note {
  private readonly window = new Float32Array(memory * quantumSize);
  private analysis = NO_AUDIO;

  analyze(quantum: Float32Array): Analysis {
    if (quantum.length === 0) {
      return this.analysis;
    }

    if (currentFrame && currentFrame % this.window.length == 0) {
      const window = this.normalize(this.window.slice());
      const power = this.power(window);
      const dpower = Math.abs(power - this.analysis.power);
      this.analysis = {
        power,
        dpower
      };
    }

    this.window.set(quantum, currentFrame % this.window.length);

    return this.analysis;
  }

  private power(window: Float32Array): number {
    return window.reduce((memo, x) => memo + x, 0) / window.length;
  }

  private normalize(window: Float32Array): Float32Array {
    for (let i = 0; i < window.length; i++) {
      let tmp = abs(window[i]); // [0, 1]
      tmp = 10 * log2(tmp); // [-Inf, 0]
      tmp = this.threshold(tmp); // [-Inf, 0]
      tmp = 2 ** (tmp / 10); // [0, 1]

      window[i] = tmp;
    }
    return window;
  }

  private threshold(dbs: number) {
    dbs = min(dbMax, max(dbMin, dbs));
    return (dbs - dbMax) / (dbs - dbMin);
  }
}
