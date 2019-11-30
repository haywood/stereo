import { floor, nthRoot } from "mathjs";
import { Fn } from "./fn";

export default class Interval implements Fn {
  constructor(readonly d: number, readonly a: number[], readonly b: number[]) {}

  get domain() {
    return this.d;
  }

  fn = x => {
    const { a, b } = this;
    return x.map((xk, k) => a[k] + xk * (b[k] - a[k]));
  };

  sample = function*(n: number) {
    const { d, fn } = this;
    n = floor(nthRoot(n, d) as number);
    const points = [[]];

    while (points.length) {
      const p = points.pop();
      const k = p.length;
      if (k < d) {
        points.push(...successors(p, k));
      } else {
        yield fn(p);
      }
    }

    function* successors(p, k) {
      for (let i = 0; i < n; i++) {
        yield [...p, i / n];
      }
    }
  };
}
