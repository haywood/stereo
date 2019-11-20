import { cos, sin, exp } from "mathjs";
import memoize from "memoizee";

export default class LogSpiral {
  cos = memoize(cos);
  sin = memoize(sin);
  exp = memoize(exp);
  constructor(readonly a: number, readonly k: number, readonly phase = 0) {}

  sample(n, a, b) {
    const step = (b - a) / n;
    const points = [];
    for (let i = 0; i < n; i++) {
      const phi = a + i * step;
      points.push(this.valueAt(phi));
    }
    return points;
  }

  valueAt(phi: number) {
    return [this.x(phi), this.y(phi)];
  }

  x(phi: number) {
    return this.r(phi) * this.cos(phi);
  }

  y(phi: number) {
    return this.r(phi) * this.sin(phi);
  }

  r(phi: number) {
    const { a, k, phase } = this;
    return a * this.exp(k * phi + phase);
  }
}
