import assert from 'assert';

import { Vector } from '../data';
import Cube from './cube';
import Rotator from './rotator';
import { CompositeFn, Fn } from '.';

export default class Sphere implements Fn {
  private readonly root: Float32Array;

  constructor(readonly d: number, r: number) {
    this.root = new Float32Array(d);
    this.root[0] = r;
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
    const { d, root } = this;
    assert.equal(phi.length, d - 1);
    assert.equal(y.length, d);

    const r = new CompositeFn(
      Array.from(new Array(d - 1).keys()).map(
        i => new Rotator(d, phi[i], 0, i + 1)
      )
    );
    r.fn(root, y);
    return y;
  };
}
