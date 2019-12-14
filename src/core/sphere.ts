import { equal } from 'mathjs';
import Rotator from './rotator';
import Cube from './cube';
import { tau, zeros } from 'mathjs';
import { Fn, components } from './fn';
import { TypedArray } from 'three';
import { Vector } from './data';

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

  fn = (phi: number[] | TypedArray, y: Vector = new Array(this.d)) => {
    const { d, root } = this;
    for (let i = 0; i < d; i++) {
      y[i] = root[i];
    }
    const rotations = components(d - 1).map((i) => ({ phi: phi[i], d0: 0, d1: i + 1 }));
    const r = new Rotator(d, rotations);
    r.fn(root, y);
    return y;
  };
}
