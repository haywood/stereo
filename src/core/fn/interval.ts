import { Fn } from './fn';
import assert from 'assert';
import { Vector } from '../data';

export default class Interval implements Fn {
  readonly domain: number;

  constructor(readonly d: number, readonly a: number[], readonly b: number[]) {
    assert.equal(a.length, d);
    assert.equal(b.length, d);
    this.domain = d;
  }

  static nPerLevel = (d: number, n: number) => {
    return Math.round(Math.pow(n, 1 / d));
  };

  /**
   * @param x A vector of length this.domain contained in the interval [0, 1].
   * @returns A mapping of the vector into this interval.
   */
  fn = (x: Float32Array, y: Vector = new Float32Array(this.d)) => {
    const { a, b, d } = this;
    assert.equal(x.length, d);
    assert.equal(y.length, d);
    for (let i = 0; i < d; i++) {
      y[i] = a[i] + x[i] * (b[i] - a[i]);
    }
    return y;
  };

  sample = function*(n: number, offset: number, limit: number) {
    const { d, fn } = this;
    n = Interval.nPerLevel(d, n);
    const points: number[][] = [[]];
    let i = 0;

    while (points.length && i < limit) {
      const p = points.pop()!;
      if (p.length < d) {
        points.push(...successors(p));
      } else if (i++ >= offset) {
        yield fn(p);
      }
    }

    function* successors(p: number[]): Generator<number[]> {
      for (let i = 0; i < n; i++) {
        yield [...p, i / n];
      }
    }
  };
}
