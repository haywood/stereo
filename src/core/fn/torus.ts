import Cube from './cube';
import Sphere from './sphere';
import { Fn } from './fn';
import { tau } from 'mathjs';
import Rotator from './rotator';
import { TypedArray } from 'three';
import { Vector } from '../data';

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

  fn = (phi: Vector, y: Vector = new Float32Array(this.d)) => {
    const { d, main, cross } = this;
    const phiCross = phi.subarray(0, d - 2);
    const phiMain = phi.subarray(d - 2);
    const rotator = new Rotator(d, phiMain[0], 0, d - 1);

    cross.fn(phiCross, y.subarray(0, d - 1));
    rotator.fn(y, y);

    // use the circle to translate the point
    // outward, creating a donut shape
    const r = new Rotator(d, phiMain[0], 0, d - 1);
    r.fn(y, y);

    return y;
  };
}
