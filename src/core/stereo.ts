import { dot, equal, min } from 'mathjs';
import { Fn } from './fn';
import Cube from './cube';
import { Vector } from './data';
import assert from 'assert';

export default class Stereo implements Fn {
  constructor(private readonly from: number, private readonly to: number) { }

  get domain() {
    return this.from;
  }

  get d() {
    return this.to;
  }

  sample = function* (n: number) {
    const cube = new Cube(this.domain, 2);
    for (const phi of cube.sample(n)) {
      yield this.fn(phi);
    }
  };

  fn = (x: Vector, y: Vector = new Float32Array(this.to)) => {
    const { from, to } = this;
    assert.equal(x.length, from);
    assert.equal(y.length, to);
    let temp;
    if (from < to) {
      temp = Stereo.up(x, to);
    } else if (from > to) {
      temp = Stereo.down(x, to);
    } else {
      temp = x;
    }
    // TODO: use set once everything is Float32Array
    for (let i = 0; i < to; i++) {
      y[i] = temp[i];
    }
    return y;
  };

  static up = (p, to) => {
    const q = new Array(p.length + 1).fill(0);
    const norm2 = dot(p, p);
    const divisor = norm2 + 1;
    q[0] = (norm2 - 1) / divisor;
    for (let i = 1; i <= p.length; i++) {
      q[i] = (2 * p[i - 1]) / divisor;
    }

    if (q.length >= to) {
      return q;
    } else {
      return Stereo.up(q, to);
    }
  };

  static down = (p, to) => {
    const q = new Array(p.length - 1).fill(0);
    for (let i = 0; i < q.length; i++) {
      q[i] = p[i + 1] / (1 - p[0]);
    }

    if (q.length <= to) {
      return q;
    } else {
      return Stereo.down(q, to);
    }
  };
}
