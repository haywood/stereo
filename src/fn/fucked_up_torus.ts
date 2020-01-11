import assert from 'assert';

import { Vector } from '../data';
import Cube from './cube';
import Sphere from './sphere';
import { Fn } from '.';

// This shape does not implement a torus. It used to,
// but then I changed the way Rotator works, which
// changed the way that the points of the sphere are
// distributed, making the translation step behave incorrectly
// Still makes a cool shape though, so keeping it
export default class FuckedUpTorus implements Fn {
  private readonly sphere: Sphere;
  private readonly circle: Sphere;

  constructor(readonly d: number, readonly r: number, readonly t: number) {
    this.sphere = new Sphere(d, t);
    this.circle = new Sphere(2, r);
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

  fn = (phi: Vector, y: Vector = new Float32Array(this.d)) => {
    const { domain, d, sphere, circle } = this;
    assert.equal(phi.length, domain);
    assert.equal(y.length, d);
    sphere.fn(phi, y);
    const q = circle.fn(phi.subarray(d - 2));
    y[0] += q[0];
    y[d - 1] += q[1];
    return y;
  };
}
