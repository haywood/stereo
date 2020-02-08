import assert from 'assert';

import { norm } from '../reducable';
import { Vector } from '../types';
import Interval from './interval';
import { Polar } from './polar';
import { Fn } from '.';

export default class Spiral implements Fn {
  private readonly interval: Interval;

  constructor(
    /**
     * The dimension of the spiral.
     */
    readonly d: number,
    /**
     * The extent of curl of the spiral, i.e. the max angle in each
     * dimension.
     */
    readonly theta: number,
    /**
     * The radial factor. This is multiplied by the magnitude
     * of the input angle vector to determine the magnitude
     * of the output.
     */
    readonly r: number
  ) {
    this.interval = new Interval(
      this.domain,
      new Array(this.domain).fill(0),
      new Array(this.domain).fill(theta)
    );
  }

  get domain() {
    return this.d - 1;
  }

  sample = function*(n: number, offset: number, limit: number) {
    for (const x of this.interval.sample(n, offset, limit)) {
      yield this.fn(x);
    }
  };

  fn = (phi: Float32Array, y: Vector = new Float32Array(this.d)) => {
    const { domain, d, r } = this;
    assert.equal(phi.length, domain);
    assert.equal(y.length, d);

    return Polar.from(r * norm(phi), phi, y);
  };
}
