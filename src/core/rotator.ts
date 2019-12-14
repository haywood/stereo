import { multiply, identity, format, index, Matrix } from 'mathjs';
import { Fn, cos, sin } from './fn';
import Cube from './cube';
import { TypedArray } from 'three';
import { Vector } from './data';
import assert from 'assert';

interface Rotation {
  readonly phi: number;
  readonly d0: number;
  readonly d1: number;
}

export default class Rotator implements Fn {
  constructor(
    readonly d: number,
    readonly rotations: Rotation[],
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

  fn = (x: Vector, y?: Vector) => {
    const { f0, f1, d, rotations } = this;
    assert.equal(x.length, d);
    y = y || x.slice();
    for (const { phi, d0, d1 } of rotations) {
      const a = y[d0], b = y[d1];
      const r0 = f0(phi);
      const r1 = f1(phi);
      y[d0] = a * r0 - b * r1;
      y[d1] = a * r1 + b * r0;
    }
    return y;
  };
}
