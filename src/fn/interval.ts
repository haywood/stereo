import assert from 'assert';

import { Vector } from '../types';
import { Fn } from '.';

export default class Interval implements Fn {
  readonly domain: number;

  constructor(readonly d: number, readonly a: number[], readonly b: number[]) {
    assert.equal(a.length, d);
    assert.equal(b.length, d);
    this.domain = d;
  }

  static nPerLevel = (d: number, n: number) => {
    return Math.round(Math.pow(n, 1 / d));
  };

  /**
   * @param x A vector of length this.domain contained in the interval [0, 1].
   * @returns A mapping of the vector into this interval.
   */
  fn = (x: Float32Array, y: Vector = new Float32Array(this.d)) => {
    const { domain, d, a, b } = this;

    assert.equal(x.length, domain);
    assert.equal(y.length, d);

    for (let i = 0; i < d; i++) {
      y[i] = a[i] + x[i] * (b[i] - a[i]);
    }

    return y;
  };

  sample = function*(n: number, offset: number, limit: number) {
    const { d, fn } = this;
    // b needs to be an integer or the shape is distorted
    const b = Math.round(n ** (1 / d));
    const x = new Float32Array(d);
    for (let i = offset; i < limit; i++) {
      for (let k = 0; k < d; k++) {
        const exp = d - k - 1;
        const n = Math.round(i / b ** exp);
        x[k] = (n % b) / (b - 1);
      }
      yield fn(x);
    }
  };
}
