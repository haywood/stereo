import { cos, sin, round, multiply, matrix } from "mathjs";
import memoize from "memoizee";

export default class Rotator {
  static cos = memoize(cos);
  static sin = memoize(sin);

  static rotatePoint(p: number[], { phi, d0, d1 }) {
    const v = [p[d0], p[d1]];
    const R = matrix([
      [this.cos(phi), -this.sin(phi)],
      [this.sin(phi), this.cos(phi)]
    ]);
    const u = multiply(R, v).valueOf();
    p[d0] = round(u[0], 5) as number;
    p[d1] = round(u[1], 5) as number;
    return p;
  }
}
