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
import Cube from "./cube";

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
    const cube = new Cube(tau, d - 1);
    const points = [];
    for (const p of cube.iterator(n)) {
      points.push(this.valueAt(p));
    }
    return points;
  };
}
