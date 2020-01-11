import { Fn, exp, components } from './fn';
import Cube from './cube';
import Sphere from './sphere';
import assert from 'assert';
import { Vector } from '../core/data';

export default class Spiral implements Fn {
  private readonly sphere: Sphere;

  constructor(readonly d: number, readonly a: number[], readonly k: number[]) {
    this.sphere = new Sphere(d, 1);
  }

  get domain() {
    return this.d - 1;
  }

  sample = function*(n: number, offset: number, limit: number) {
    const cube = new Cube(this.domain, 4 * Math.PI);
    for (const phi of cube.sample(n, offset, limit)) {
      yield this.fn(phi);
    }
  };

  fn = (phi: Float32Array, y: Vector = new Float32Array(this.d)) => {
    const { a, k, domain, d } = this;
    assert.equal(phi.length, d - 1);
    assert.equal(y.length, d);

    this.sphere.fn(phi, y);
    let x = 0;
    for (let i = 0; i < domain; i++) {
      x += k[i] * phi[i];
    }
    const r = exp(x);
    for (let i = 0; i < d; i++) {
      y[i] = y[i] * a[i] * r;
    }
    return y;
  };
}
