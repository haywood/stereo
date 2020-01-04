import Interval from './interval';
import { Fn } from './fn';
import { Vector } from '../data';

export default class Cube implements Fn {
  private readonly interval: Interval;

  constructor(readonly d: number, readonly l: number) {
    this.interval = new Interval(
      d,
      new Array(d).fill(-l / 2),
      new Array(d).fill(l / 2),
    );
  }

  get domain() {
    return this.d;
  }

  fn = (x: Vector, y?: Vector) => this.interval.fn(x, y);

  sample = (n: number, offset: number, limit: number) =>
    this.interval.sample(n, offset, limit);
}
