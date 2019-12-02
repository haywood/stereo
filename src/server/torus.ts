import Cube from './cube';
import Sphere from './sphere';
import {Fn} from './fn';
import {tau} from 'mathjs';

export default class Torus implements Fn {
  private readonly sphere: Sphere;
  private readonly circle: Sphere;

  constructor(readonly d: number, readonly r: number, readonly t: number) {
    this.sphere = new Sphere(d, t);
    this.circle = new Sphere(2, r);
  }

  get domain() {
    return this.d - 1;
  }

  sample = function* (this: Torus, n: number) {
    const cube = new Cube(this.domain, tau);
    for (const phi of cube.sample(n)) {
      yield this.fn(phi);
    }
  };

  fn = (phi: number[]): number[] => {
    const {d, r, sphere, circle} = this;
    const p = sphere.fn(phi);
    const q = circle.fn([phi[d - 2]]);
    p[0] += q[0];
    p[d - 1] += q[1];
    return p;
  };
}
