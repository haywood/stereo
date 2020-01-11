import Cube from './cube';
import Sphere from './sphere';
import { Fn } from '.';
import Rotator from './rotator';
import assert from 'assert';
import { Vector } from '../data';

export default class Torus implements Fn {
  private readonly cross: Sphere;

  constructor(readonly d: number, readonly r: number, readonly t: number) {
    assert(d > 2, `torus is only defined for d > 2; got ${d}`);
    this.cross = new Sphere(d - 1, t);
  }

  get domain() {
    return this.d - 1;
  }

  sample = function*(n: number, offset: number, limit: number) {
    const cube = new Cube(this.domain, 2 * Math.PI);
    for (const phi of cube.sample(n, offset, limit)) {
      yield this.fn(phi);
    }
  };

  fn = (theta: Vector, y: Vector = new Float32Array(this.d)) => {
    const { cross, d, r } = this;
    assert.equal(
      theta.length,
      d - 1,
      `torus expects an input of ${d - 1}; got ${theta.length}`
    );
    const rotator = new Rotator(d, theta[d - 2], 0, d - 1);

    cross.fn(theta.subarray(0, d - 2), y.subarray(0, d - 1));
    y[0] += r;
    rotator.fn(y, y);

    return y;
  };
}
