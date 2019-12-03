import {Fn, exp, components} from './fn';
import Cube from './cube';
import Sphere from './sphere';
import {tau, sum, multiply} from 'mathjs';

export default class Spiral implements Fn {
  private readonly sphere;

  constructor(readonly d: number, readonly a: number, readonly k: number[]) {
    if (k.length !== d - 1) {
      throw new Error(`Invalid k ${k} for dimension ${d}`);
    }
    this.sphere = new Sphere(d, 1);
  }

  get domain() {
    return this.d - 1;
  }

  sample = function* (this: Spiral, n) {
    const cube = new Cube(this.domain, 2 * tau);
    for (const phi of cube.sample(n)) {
      yield this.fn(phi);
    }
  };

  fn = (phi: number[]) => {
    const r = this.r(phi);
    return this.sphere.fn(phi).map((p) => p * r);
  };

  r = (phi: number[]): number => {
    const {a, k} = this;
    const x = sum(multiply(phi, k));
    return a * exp(x);
  };
}
