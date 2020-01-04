import CircularBuffer from 'circular-buffer';
import { frameSize } from './constants';

export type Analysis = {
  power: number;
  dpower: number;
};

const NO_AUDIO: Analysis = {
  power: 0,
  dpower: 0,
};

const { round, abs, log2, min, max } = Math;

const memory = round(sampleRate / frameSize / 100); // enough for ~10ms of audio

export class Note {
  private readonly frames = new CircularBuffer<Float32Array>(memory);
  private prevPower = 0;
  dbMin = -Infinity;
  dbMax = 0;

  analyze(frame: Float32Array): Analysis {
    if (frame.length === 0) {
      return NO_AUDIO;
    }

    this.frames.push(frame);
    if (this.frames.size() < this.frames.capacity()) {
      return NO_AUDIO;
    }

    const window = new Float32Array(this.frames.size() * frame.length);
    for (let i = 0; i < this.frames.size(); i++) {
      window.set(this.frames.get(i), i * frame.length);
    }
    this.normalize(window);

    const power = this.power(window);
    const dpower = Math.abs(power - this.prevPower);
    this.prevPower = power;

    return { power, dpower };
  }

  private power(window: Float32Array): number {
    return window.reduce((memo, x) => memo + x, 0) / window.length;
  }

  private normalize(window: Float32Array): void {
    for (let i = 0; i < window.length; i++) {
      let tmp = abs(window[i]); // [0, 1]
      tmp = 10 * log2(tmp); // [-Inf, 0]
      tmp = this.threshold(tmp); // [-Inf, 0]
      tmp = 2 ** (tmp / 10); // [0, 1]

      window[i] = tmp;
    }
  }

  private threshold(dbs: number) {
    if (this.dbMax === this.dbMin) {
      return dbs === this.dbMax ? 0 : -Infinity;
    }

    dbs = min(this.dbMax, max(this.dbMin, dbs));
    return (dbs - this.dbMax) / (dbs - this.dbMin);
  }
}
