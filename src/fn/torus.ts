import assert from 'assert';

import { Vector } from '../types';
import Lattice from './lattice';
import Rotator from './rotator';
import Sphere from './sphere';
import { Fn } from '.';

export default class Torus implements Fn {
  constructor(readonly d: number, readonly r: Float32Array) {
    assert(d > 2, `torus: expected d = ${d} > 2`);
    assert(
      r.length == this.domain,
      `torus: expected r.length = ${r.length} == ${this.domain}`
    );
  }

  get domain() {
    return this.d - 1;
  }

  sample = function*(n: number, offset: number, limit: number) {
    const lattice = new Lattice(this.domain, 2 * Math.PI);
    for (const phi of lattice.sample(n, offset, limit)) {
      yield this.fn(phi);
    }
  };

  fn = (theta: Vector, y: Vector = new Float32Array(this.d)) => {
    const { d, domain, r } = this;
    const circle = new Sphere(2, r[0]);
    circle.fn(theta.subarray(0, 1), y.subarray(0, 2));
    for (let i = 1; i < domain; i++) {
      y[0] += r[i];
      const rotator = new Rotator(d, theta[i], i - 1, i + 1);
      rotator.fn(y, y);
    }
    return y;
  };
}
