import CircularBuffer from 'circular-buffer';

export type Analysis = {
  power: number; onset: 0 | 1;
}

export class Note {
  private readonly frames = new CircularBuffer<Float32Array>(2);
  private dbMin = -Infinity;
  private dbMax = 0;

  analyze(frame: Float32Array): Analysis {
    if (frame.length === 0) {
      return {power: 0, onset: 0};
    }

    this.frames.push(frame);
    if (this.frames.size() < this.frames.capacity()) {
      return {power: 0, onset: 0};
    }

    const window = new Float32Array(this.frames.size() * frame.length);
    for (let i = 0; i < this.frames.size(); i++) {
      window.set(this.frames.get(i), i * frame.length);
    }
    this.normalize(window);

    const power = this.power(window);
    const onset = this.onset(window);

    return {power, onset};
  }

  private power(window: Float32Array): number {
    return window.reduce((memo, x) => memo + x, 0) / window.length;
  }

  private onset(window: Float32Array): 0|1 {
    const dt = 10;
    const delta = new Float32Array(Math.round(window.length / dt));
    for (let k = 0; k < delta.length; k++) {
      const offset = 1 + k * dt;
      const limit = Math.min(offset + dt, window.length);
      for (let j = offset; j < limit; j++) {
        delta[k] += Math.abs(window[j] - window[j - 1]);
      }
      delta[k] /= (limit - offset);
    }

    const dk = 10;
    for (let k = dk; k < delta.length - dk; k++) {
      if (this.isLocalMax(delta, k, dk)) return 1;
    }

    return 0;
  }

  private isLocalMax(window: Float32Array, k: number, dk: number): boolean {
    const r = Math.round(dk / 2);
    for (let j = k - r; j < k + r; j++) {
      if (window[j] > 0) return false;
    }
    return true;
  }

  private normalize(window: Float32Array): void {
    for (let i = 0; i < window.length; i++) {
      let tmp = Math.abs(window[i]);  // [0, 1]
      tmp = 10 * Math.log2(tmp);      // [-Inf, 0]
      tmp = this.threshold(tmp);      // [-Inf, 0]
      tmp--;                          // [-Inf, -1]
      tmp = 1 / Math.abs(tmp);        // [0, 1]

      window[i] = tmp;
    }
  }

  private threshold(dbs: number) {
    if (this.dbMax === this.dbMin) {
      return dbs === this.dbMax ? 0 : -Infinity;
    }

    dbs = Math.min(this.dbMax, Math.max(this.dbMin, dbs));
    return (dbs - this.dbMax) / (dbs - this.dbMin);
  }
}
