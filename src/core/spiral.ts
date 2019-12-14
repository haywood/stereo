import { Fn, exp, components } from './fn';
import Cube from './cube';
import Sphere from './sphere';
import { tau, sum, multiply } from 'mathjs';
import { Vector } from './data';
import assert from 'assert';

export default class Spiral implements Fn {
  private readonly sphere: Sphere;

  constructor(readonly d: number, readonly a: number[], readonly k: number[]) {
    this.sphere = new Sphere(d, 1);
  }

  get domain() {
    return this.d - 1;
  }

  sample = function* (n: number) {
    const cube = new Cube(this.domain, 2 * tau);
    for (const phi of cube.sample(n)) {
      yield this.fn(phi);
    }
  };

  fn = (phi: number[], y: Vector = new Array(this.d)) => {
    const { a, k, d } = this;
    assert.equal(phi.length, d - 1);
    assert.equal(y.length, d);

    this.sphere.fn(phi, y);
    const x = sum(multiply(k, phi));
    const r = exp(x);
    for (let i = 0; i < d; i++) {
      y[i] = y[i] * a[i] * r;
    }
    return y;
  };
}
