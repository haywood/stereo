import { Fn, exp, components } from './fn';
import Cube from './cube';
import Sphere from './sphere';
import { tau, sum, multiply } from 'mathjs';

export default class Spiral implements Fn {
  private readonly sphere;

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

  fn = (phi: number[]) => {
    const { r } = this;
    return this
      .sphere
      .fn(phi)
      .map((x: number, i: number) => x * r(phi, i));
  };

  r = (phi: number[], i: number): number => {
    const { a, k } = this;
    const x = sum(multiply(k, phi));
    return a[i] * exp(x);
  };
}
