import { round, matrix, multiply, cos, sin, pi, tau, nthRoot } from "mathjs";
import memoize from "memoizee";

export default class Sphere2 {
  cos = memoize(cos);
  sin = memoize(sin);

  constructor(readonly r: number, readonly d: number) {}

  valueAt(phi: number[]) {
    const { r, d } = this;
    if (phi.length !== d - 1) {
      throw new Error(
        `Expected phi.length to be ${d - 1}, but was ${phi.length}`
      );
    }
    const p = new Array(d).fill(0);
    p[0] = r;
    for (let i = 0; i < phi.length; i++) {
      this.rotatePoint(p, { phi: phi[i], d0: i, d1: i + 1 });
    }
    return p;
  }

  sample(n: number, phi0: number[], phi1: number[]) {
    const { d } = this;
    const m = nthRoot(n, Math.max(d - 1, 1)) as number;
    return this.generatePoints(m, 0, phi0, phi1);
  }

  // TODO: this complexity formula is still wrong :(
  // numPoints(d) = n * numPoints(d - 1)
  // numPoints(0) = 1
  // numPoints(1) = n * numPoints(0) = n * 1
  // numPoints(2) = n * numPoints(1) = n * n * 1;
  generatePoints(n: number, k: number, phi: number[], phi1: number[]) {
    const { d } = this;
    if (k >= d - 1) return [this.valueAt(phi)];
    const points = [];
    phi = phi.slice();
    for (let i = 0; i < n; i++) {
      phi[k] = (i * phi1[k]) / n;
      points.push(...this.generatePoints(n, k + 1, phi, phi1));
    }
    return points;
  }

  rotatePoint(p: number[], theta: { phi: number; d0: number; d1: number }) {
    const { phi, d0, d1 } = theta;
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
