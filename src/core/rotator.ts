import { Fn, cos, sin } from './fn';
import Cube from './cube';
import { Vector } from './data';
import assert from 'assert';

export default class Rotator implements Fn {
  constructor(
    readonly d: number,
    readonly phi: number,
    readonly d0: number,
    readonly d1: number,
    readonly f0 = cos,
    readonly f1 = sin,
  ) { }

  get domain() {
    return this.d;
  }

  sample = function* (this: Rotator, n: number) {
    const cube = new Cube(this.domain, 2);
    for (const p of cube.sample(n)) {
      yield this.fn(p);
    }
  };

  fn = (x: Vector, y: Vector = new Array(this.d)) => {
    const { d, phi, d0, d1, f0, f1 } = this;
    assert.equal(x.length, d);
    assert.equal(y.length, d);

    for (let i = 0; i < d; i++) {
      y[i] = x[i];
    }

    const a = y[d0], b = y[d1];
    const r0 = f0(phi);
    const r1 = f1(phi);
    y[d0] = a * r0 - b * r1;
    y[d1] = a * r1 + b * r0;
    return y;
  };
}
