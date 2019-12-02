import Interval from "./interval";
import { Fn } from "./fn";

export default class Cube implements Fn {
  private readonly interval: Interval;

  constructor(readonly d: number, readonly l: number) {
    this.interval = new Interval(
      d,
      new Array(d).fill(-l / 2),
      new Array(d).fill(l / 2)
    );
  }

  get domain() {
    return this.d;
  }

  fn = x => this.interval.fn(x);

  sample = n => this.interval.sample(n);
}
