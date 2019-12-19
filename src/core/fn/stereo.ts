import { Fn } from './fn';
import Cube from './cube';
import { Vector } from '../data';
import assert from 'assert';

export default class Stereo implements Fn {
  private readonly fromTemp: Vector;
  private readonly toTemp: Vector;

  constructor(private readonly from: number, private readonly to: number) {
    this.fromTemp = new Float32Array(Math.max(from, to));
    this.toTemp = new Float32Array(Math.max(from, to));
  }

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
    let { from, to, fromTemp, toTemp } = this;
    assert.equal(x.length, from);
    assert.equal(y.length, to);

    if (from === to) {
      y.set(x);
      return y;
    }

    fromTemp.set(x);

    while (from < to) {
      Stereo.up(
        fromTemp.subarray(0, from),
        toTemp.subarray(0, ++from)
      );
      fromTemp.set(toTemp);
    }

    while (from > to) {
      Stereo.down(
        fromTemp.subarray(0, from),
        toTemp.subarray(0, --from)
      );
      fromTemp.set(toTemp);
    }

    y.set(toTemp.subarray(0, to));
    return y;
  };

  static up = (x: Vector, temp: Vector) => {
    assert.equal(temp.length, x.length + 1);
    const n2 = norm2(x);
    const divisor = n2 + 1;
    temp[0] = (n2 - 1) / divisor;
    for (let i = 1; i <= x.length; i++) {
      temp[i] = (2 * x[i - 1]) / divisor;
    }
  };

  static down = (x: Vector, temp: Vector) => {
    assert.equal(temp.length, x.length - 1);
    for (let i = 0; i < temp.length; i++) {
      temp[i] = x[i + 1] / (1 - x[0]);
    }
  };
}

const norm2 = (x: Vector) => {
  let result = 0;
  for (let i = 0; i < x.length; i++) {
    result += x[i] * x[i];
  }
  return result;
};
