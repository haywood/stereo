import { nthRoot } from "mathjs";

export default class Cube {
  constructor(readonly l: number, readonly d: number) {}

  sample = (n: number) => {
    return Array.from(this.iterator(n));
  };

  iterator = (n: number) => {
    const { d, l, generatePoints } = this;
    return generate();

    function* generate() {
      const top = new Array(d).fill(l / 2);
      const bottom = new Array(d).fill(-l / 2);
      n = Math.floor(nthRoot(n, d) as number);
      for (const p of generatePoints(n, 0, bottom, top, bottom)) {
        yield p;
      }
    }
  };

  generatePoints = (
    n: number,
    k: number,
    v: number[],
    top: number[],
    bottom: number[]
  ) => {
    const { d, l, generatePoints } = this;
    v = v.slice();
    if (k >= d) return [v];
    return generate();

    function* generate() {
      const points = [];
      for (let i = 0; i <= n; i++) {
        v[k] = -l / 2 + (i * l) / n;
        for (const p of generatePoints(n, k + 1, v, top, bottom)) {
          yield p;
        }
      }
    }
  };
}
