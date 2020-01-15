import assert from 'assert';
import { Fn } from '.';
import { Vector } from '../data';
import Cube from './cube';

export default class Sphere implements Fn {
  private readonly root: Float32Array;

  constructor(readonly d: number, private readonly r: number) {}

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
    const { d, r } = this;
    assert.equal(phi.length, d - 1);
    assert.equal(y.length, d);

    y[0] = r;
    for (let i = 1; i < y.length; i++) {
      const sin = Math.sin(phi[i - 1]);
      const cos = Math.cos(phi[i - 1]);
      y[i] = y[0] * sin;
      y[0] *= cos;
    }

    return y;
  };
}
