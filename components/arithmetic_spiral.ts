import { cos, sin } from "mathjs";

export default class ArithmeticSpiral {
  constructor(readonly a: number, readonly b: number, readonly phase = 0) {}

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
    return this.r(phi) * cos(phi);
  }

  y(phi: number) {
    return this.r(phi) * sin(phi);
  }

  r(phi: number) {
    const { a, b, phase } = this;
    return a + b * (phi + phase);
  }
}
