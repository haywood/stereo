import assert from 'assert';

import { Vector } from '../types';
import Lattice from './lattice';
import { Fn } from '.';

export default class Cube implements Fn {
  constructor(readonly d: number, readonly l: number) {}

  get domain() {
    return this.d;
  }

  fn = (x: Vector, y: Vector = new Float32Array(this.d)) => {
    const { domain, d, l } = this;

    assert.equal(x.length, domain);
    assert.equal(y.length, d);

    for (let i = 0; i < d; i++) {
      y[i] = l * (x[i] - 0.5);
    }

    return y;
  };

  sample = function*(n: number, offset: number, limit: number) {
    // TODO: This algorithm produces lots of duplicate points.
    // It looks good enough, but could be better.
    const { d } = this;
    const scale = 1 / d / 2;
    const faceN = Math.round(n * scale);
    const faceOffset = Math.round(offset * scale);
    const faceSize = Math.round((limit - offset) * scale);
    let count = 0;

    for (let k = 0; k < d; k++) {
      for (const sign of [1, -1]) {
        const faceLimit = faceOffset + Math.min(faceSize, n - count);
        yield* this.sampleFace(k, sign, faceN, faceOffset, faceLimit);
        count += faceLimit - faceOffset;
      }
    }
  };

  private sampleFace = function*(
    k: number,
    sign: number,
    n: number,
    offset: number,
    limit: number
  ) {
    const { d, l } = this;
    const lattice = new Lattice(d - 1, l);
    const lhalf = l / 2;

    for (const y0 of lattice.sample(n, offset, limit)) {
      const y = new Float32Array(d);
      y.set(y0.subarray(0, k));
      y.set(y0.subarray(k), k + 1);

      y[k] = sign * lhalf;
      yield y;
    }
  };
}
