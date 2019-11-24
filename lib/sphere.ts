import {
  add,
  divide,
  equal,
  round,
  matrix,
  multiply,
  cos,
  sin,
  pi,
  tau,
  nthRoot
} from "mathjs";
import Rotator from "./rotator";

export default class Sphere {
  constructor(readonly r: number, readonly d: number) {}

  valueAt = (phi: number[]) => {
    const { r, d } = this;
    if (phi.length !== d - 1) {
      throw new Error(
        `Expected phi.length to be ${d - 1}, but was ${phi.length}`
      );
    }
    const p = new Array(d).fill(0);
    let start = phi.findIndex(x => !equal(x, 0));
    if (start < 0) start = 0;
    p[start] = r;
    for (let offset = 0; offset < phi.length; offset++) {
      const i = (start + offset) % phi.length;
      Rotator.rotatePoint(p, { phi: phi[i], d0: i, d1: i + 1 });
    }
    return p;
  };

  sample = (n: number) => {
    const { d } = this;
    const phi0 = new Array(d - 1).fill(0);
    const phi1 = new Array(d - 1).fill(tau);
    n = Math.floor(nthRoot(n, d - 1) as number);
    return this.generatePoints(n, 0, phi0, phi1);
  };

  generatePoints = (n: number, k: number, phi: number[], phi1: number[]) => {
    const { d } = this;
    if (k >= d - 1) return [this.valueAt(phi)];
    const points = [];
    phi = phi.slice();
    for (let i = 0; i < n; i++) {
      phi[k] = (i * phi1[k]) / n;
      points.push(...this.generatePoints(n, k + 1, phi, phi1));
    }
    return points;
  };
}
