import Cube from './cube';
import Sphere from './sphere';
import {Fn} from './fn';
import {tau} from 'mathjs';
import Rotator from './rotator';

export default class Torus implements Fn {
  private readonly cross: Sphere;
  private readonly main: Sphere;

  constructor(readonly d: number, readonly r: number, readonly t: number) {
    this.cross = new Sphere(this.d - 1, t);
    this.main = new Sphere(2, r);
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
    const {d, main, cross} = this;
    const phiCross = phi.slice(0, d - 2);
    const phiMain = phi[d - 2];
    const rotator = new Rotator(
      d, [{phi: phiMain, d0: 0, d1: d - 1}]);

    let p = cross.fn(phiCross);
    p.push(0);

    p = rotator.fn(p);
    
    // use the circle to translate the point
    // outward, creating a donut shape
    const q = main.fn([phiMain]);
    p[0] += q[0];
    p[d - 1] += q[1];
    
    return p;
  };
}
