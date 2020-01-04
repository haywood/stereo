import CircularBuffer from 'circular-buffer';

export type Analysis = {
  power: number;
}

export class Note {
  // the class uses a 3 frame (~10ms) window to analyze the audio
  private readonly frames = new CircularBuffer<Float32Array>(3);
  dbMin = -Infinity;
  dbMax = 0;

  analyze(frame: Float32Array): Analysis {
    if (frame.length === 0) {
      return {power: 0};
    }

    this.frames.push(frame);
    if (this.frames.size() < this.frames.capacity()) {
      return {power: 0};
    }

    const window = new Float32Array(this.frames.size() * frame.length);
    for (let i = 0; i < this.frames.size(); i++) {
      window.set(this.frames.get(i), i * frame.length);
    }
    this.normalize(window);

    const power = this.power(window);

    return {power};
  }

  private power(window: Float32Array): number {
    return window.reduce((memo, x) => memo + x, 0) / window.length;
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
