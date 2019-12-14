import { equal } from 'mathjs';
import Rotator from './rotator';
import Cube from './cube';
import { tau, zeros } from 'mathjs';
import { Fn, components } from './fn';
import { TypedArray } from 'three';
import { Vector } from './data';
import assert from 'assert';

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
    assert.equal(phi.length, d - 1);
    assert.equal(y.length, d);

    const temp = new Float32Array(root);
    for (const r of components(d - 1).map((i) => new Rotator(d, phi[i], 0, i + 1))) {
      r.fn(temp, y);
      temp.set(y);
    }
    return y;
  };
}
