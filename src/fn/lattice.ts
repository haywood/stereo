import { Vector } from '../types';
import Interval from './interval';
import { Fn } from '.';

export default class Lattice implements Fn {
  private readonly interval: Interval;
  readonly sample: (
    n: number,
    offset: number,
    limit: number
  ) => Generator<Float32Array>;

  constructor(readonly d: number, readonly l: number) {
    this.interval = new Interval(
      d,
      new Array(d).fill(-l / 2),
      new Array(d).fill(l / 2)
    );

    this.sample = this.interval.sample;
  }

  get domain() {
    return this.d;
  }

  fn = (x: Vector, y?: Vector) => this.interval.fn(x, y);
}
