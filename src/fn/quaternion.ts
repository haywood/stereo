import assert from 'assert';

import Interval from './interval';
import { Fn } from '.';

/**
 * Implements right multiplication by a fixed quaternion. Does zero padding
 * when the input is less than 4 and simply leaves higher dimensions untouched
 * when the dimension is greater than 4.
 */
export class Quaternion implements Fn {
  readonly q: Float32Array;
  readonly table: ReturnType<typeof rule>[];

  constructor(readonly d: number, r: number, i: number, j: number, k: number) {
    this.q = new Float32Array(Math.max(d, 4));
    this.table = [
      rule(r, [0, 1, 2, 3], [1, 1, 1, 1]),
      rule(i, [1, 0, 3, 2], [1, -1, 1, -1]),
      rule(j, [2, 3, 0, 1], [1, -1, -1, 1]),
      rule(k, [3, 2, 1, 0], [1, 1, -1, -1])
    ];
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
    const { d, domain, q } = this;
    assert.equal(
      x.length,
      domain,
      `Quaternion: expected x to be of dimension ${d}, but was ${x.length}`
    );

    q.fill(0);
    q.set(x);

    this.table.forEach(r => r(x, q));

    y.set(q.subarray(0, d));
    return y;
  };
}

function rule(v: number, index: number[], sign: number[]) {
  return (x: Float32Array, y: Float32Array) => {
    const limit = Math.min(4, x.length);
    for (let i = 0; i < limit; i++) {
      y[index[i]] += sign[i] * x[i] * v;
    }
  };
}
