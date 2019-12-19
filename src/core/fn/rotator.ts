import { Fn, cos, sin } from './fn';
import Cube from './cube';
import { Vector } from '../data';
import assert from 'assert';

export default class Rotator implements Fn {
  readonly r0: number;
  readonly r1: number;

  constructor(
    readonly d: number,
    readonly phi: number,
    readonly d0: number,
    readonly d1: number,
    readonly f0: (phi: number) => number = cos,
    readonly f1: (phi: number) => number = sin,
  ) {
    this.r0 = f0(phi);
    this.r1 = f1(phi);
  }

  get domain() {
    return this.d;
  }

  sample = function* (this: Rotator, n: number) {
    const cube = new Cube(this.domain, 2);
    for (const p of cube.sample(n)) {
      yield this.fn(p);
    }
  };

  fn = (x: Vector, y: Vector = new Float32Array(this.d)) => {
    const { d, d0, d1, r0, r1 } = this;
    assert.equal(x.length, d);
    assert.equal(y.length, d);

    const a = x[d0], b = x[d1];
    y[d0] = a * r0 - b * r1;
    y[d1] = a * r1 + b * r0;
    return y;
  };
}
