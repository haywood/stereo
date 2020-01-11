import Rotator from './rotator';
import Cube from './cube';
import { Fn, components, CompositeFn } from './fn';
import { TypedArray } from 'three';
import { Vector } from '../core/data';
import assert from 'assert';

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
      components(d - 1).map(i => new Rotator(d, phi[i], 0, i + 1)),
    );
    r.fn(root, y);
    return y;
  };
}
