import CircularBuffer from 'circular-buffer';
import { frameSize } from './constants';

export type Analysis = {
  power: number;
};

const NO_AUDIO: Analysis = {
  power: 0,
};

const { round, abs, log2, min, max } = Math;

const memory = round(sampleRate / frameSize / 100); // enough for ~10ms of audio

type Reducable<T> = {
  reduce<M>(cb: (memo: M, t: T) => M, m0?: M): M;
  length: number;
};

const mean = (xs: Reducable<number>) =>
  xs.reduce((memo, x) => memo + x, 0) / xs.length;

export class Note {
  private readonly frames = new CircularBuffer<Float32Array>(memory);
  private readonly deltas = new CircularBuffer<number>(memory);
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
    const dpower = this.dpower(window);
    const deltas = this.deltas.toarray();
    this.deltas.push(this.dpower(window));

    deltas.sort((a, b) => a - b);
    const medianDelta = deltas[round(deltas.length / 2)];
    const meanDelta = mean(deltas);
    const onset = dpower > 0.5 * medianDelta + 0.5 * meanDelta ? 1 : 0;

    return { power: power * onset };
  }

  private power(window: Float32Array): number {
    return window.reduce((memo, x) => memo + x, 0) / window.length;
  }

  private dpower(window: Float32Array): number {
    const delta = new Float32Array(window.length - 1);
    for (let i = 0; i < delta.length; i++) {
      delta[i] = abs(window[i] - window[i + 1]); // [0, 1]
    }
    return delta.reduce((memo, x) => memo + x, 0) / delta.length;
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
