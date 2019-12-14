import { floor, nthRoot } from 'mathjs';
import { Fn } from './fn';
import assert from 'assert';
import { Vector } from './data';

export default class Interval implements Fn {
  readonly domain: number;

  constructor(readonly d: number, readonly a: number[], readonly b: number[]) {
    assert.equal(a.length, d);
    assert.equal(b.length, d);
    this.domain = d;
  }

  static nPerLevel = (d: number, n: number) => floor(nthRoot(n, d) as number);

  static n = (d: number, n: number) => Interval.nPerLevel(d, n) ** d;

  /**
   * @param x A vector of length this.domain contained in the interval [0, 1].
   * @returns A mapping of the vector into this interval.
   */
  fn = (x: Vector, y: Vector = new Array(this.d)) => {
    const { a, b, d } = this;
    assert.equal(x.length, d);
    assert.equal(y.length, d);
    for (let i = 0; i < d; i++) {
      y[i] = a[i] + x[i] * (b[i] - a[i]);
    }
    return y;
  };

  sample = function* (n: number) {
    const { d, fn } = this;
    n = Interval.nPerLevel(d, n);
    const points: number[][] = [[]];

    while (points.length) {
      const p = points.pop()!;
      if (p.length < d) {
        points.push(...successors(p));
      } else {
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
