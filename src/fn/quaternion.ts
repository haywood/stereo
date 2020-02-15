import assert from 'assert';

import Interval from './interval';
import { Fn } from '.';

/**
 * Implements right multiplication by a fixed quaternion. Does zero padding
 * when the input is smaller than 4 and simply leaves higher dimensions
 * untouched.
 */
export class Quaternion implements Fn {
  readonly q: Float32Array;

  constructor(
    readonly d: number,
    readonly r: number,
    readonly i: number,
    readonly j: number,
    readonly k: number
  ) {
    this.q = new Float32Array(Math.max(d, 4));
  }

  get domain() {
    return this.d;
  }

  readonly sample = function*(n: number, offset: number, limit: number) {
    const { d, fn } = this;
    const zero = new Array(d).fill(0);
    const one = new Array(d).fill(1);
    const interval = new Interval(d, zero, one);
    for (const x of interval.sample(n, offset, limit)) {
      yield fn(x);
    }
  };

  readonly fn = (x: Float32Array, y = new Float32Array(this.d)) => {
    const { d, domain, q, r, i, j, k } = this;
    assert.equal(
      x.length,
      domain,
      `Quaternion: expected x to be of dimension ${d}, but was ${x.length}`
    );

    q.fill(0);
    q.set(x);

    q[0] = q[0] * r - q[1] * i - q[2] * j - q[3] * k;
    q[1] = q[0] * i + q[1] * r + q[2] * k - q[3] * j;
    q[2] = q[0] * j - q[1] * k + q[2] * r + q[3] * i;
    q[3] = q[0] * k + q[1] * j - q[2] * i + q[3] * r;

    y.set(q.subarray(0, d));
    return y;
  };
}
