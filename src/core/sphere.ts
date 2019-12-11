import {equal} from 'mathjs';
import Rotator from './rotator';
import Cube from './cube';
import {tau, zeros} from 'mathjs';
import {Fn, components} from './fn';

export default class Sphere implements Fn {
  private readonly root: number[];

  constructor(readonly d: number, r: number) {
    this.root = zeros(d).valueOf() as number[];
    this.root[0] = r;
  }

  get domain() {
    return this.d - 1;
  }

  sample = function* (n: number) {
    const cube = new Cube(this.domain, tau);
    for (const phi of cube.sample(n)) {
      yield this.fn(phi);
    }
  };

  fn = (phi: number[]) => {
    const {d, root} = this;
    const r = new Rotator(d, components(d - 1).map((i) => ({phi: phi[i], d0: 0, d1: i + 1})));
    return r.fn(root);
  };
}
