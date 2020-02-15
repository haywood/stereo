import assert from 'assert';

import { Vector } from '../types';
import Lattice from './lattice';
import { Fn } from '.';

export default class Rotator implements Fn {
  readonly r0: number;
  readonly r1: number;

  constructor(
    readonly d: number,
    readonly theta: number,
    readonly d0: number,
    readonly d1: number,
    readonly f0: (theta: number) => number = Math.cos,
    readonly f1: (theta: number) => number = Math.sin
  ) {
    assert(0 <= d0 && d0 < d, `Rotator: Expected 0 <= d0 = ${d0} < d = ${d}`);
    assert(0 <= d1 && d1 < d, `Rotator: Expected 0 <= d1 = ${d1} < d = ${d}`);

    this.r0 = f0(theta);
    this.r1 = f1(theta);
  }

  get domain() {
    return this.d;
  }

  sample = function*(n: number, offset: number, limit: number) {
    const lattice = new Lattice(this.domain, 2);
    for (const p of lattice.sample(n, offset, limit)) {
      yield this.fn(p);
    }
  };

  fn = (x: Vector, y: Vector = new Float32Array(this.d)) => {
    const { d, d0, d1, r0, r1 } = this;
    assert.equal(x.length, d);
    assert.equal(y.length, d);
    y.set(x);

    const a = x[d0],
      b = x[d1];
    y[d0] = a * r0 - b * r1;
    y[d1] = a * r1 + b * r0;
    return y;
  };
}
