import assert from 'assert';

import { Vector } from '../data';
import Interval from './interval';
import { Polar } from './polar';
import { Fn } from '.';

export default class Spiral implements Fn {
  constructor(
    /**
     * The dimension of the spiral.
     */
    readonly d: number,
    /**
     * The extent of curl of the spiral, i.e. the max angle.
     */
    readonly theta: number,
    /**
     * The factor by which the radius increases in each dimension.
     */
    readonly a: number[]
  ) {
    assert.equal(
      a.length,
      d,
      `spiral: Expected a to be of dimension ${d}, but was ${a.length}`
    );
  }

  get domain() {
    return this.d - 1;
  }

  sample = function*(n: number, offset: number, limit: number) {
    const interval = new Interval(
      this.domain,
      new Array(this.domain).fill(0),
      new Array(this.domain).fill(1)
    );

    for (const x of interval.sample(n, offset, limit)) {
      yield this.fn(x);
    }
  };

  fn = (x: Float32Array, y: Vector = new Float32Array(this.d)) => {
    const { domain, d, theta, a } = this;
    assert.equal(x.length, domain);
    assert.equal(y.length, d);

    const phi = x.map(xi => xi * theta);
    Polar.from(1, phi, y);

    y[0] *= a[0] * phi[0];
    for (let i = 1; i < d; i++) {
      y[i] *= a[i] * phi[i - 1];
    }

    return y;
  };
}
