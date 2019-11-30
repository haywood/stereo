import { tau, matrix, multiply } from "mathjs";
import { Fn, cos, sin } from "./fn";

export default class Rotator implements Fn {
  constructor(
    readonly d: number,
    readonly phi: number,
    readonly d0: number,
    readonly d1: number,
    readonly f0 = cos,
    readonly f1 = sin
  ) {}

  get domain() {
    return this.d;
  }

  fn(p: number[]) {
    const { d, phi, d0, d1, f0, f1 } = this;
    if (d0 < 0 || d1 < 0 || d0 > d || d1 > d) {
      return p;
    }
    const q = p.slice();
    const R = matrix([
      [cos(phi), -sin(phi)],
      [sin(phi), cos(phi)]
    ]);
    const y = multiply(R, [p[d0], p[d1]]).valueOf();
    q[d0] = y[0];
    q[d1] = y[1];
    return q;
  }
}
