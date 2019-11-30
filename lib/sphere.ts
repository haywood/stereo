import { equal } from "mathjs";
import Rotator from "./rotator";
import Cube from "./cube";
import { tau } from "mathjs";
import { Fn, components } from "./fn";

export default class Sphere implements Fn {
  private readonly root: number[];

  constructor(readonly d: number, r: number) {
    this.root = [r, ...new Array(d - 1).fill(0)];
  }

  get domain() {
    return this.d - 1;
  }

  sample = function*(n) {
    const cube = new Cube(this.domain, tau);
    for (const phi of cube.sample(n)) {
      yield this.fn(phi);
    }
  };

  fn = (phi: number[]) => {
    const { d, root } = this;
    return components(d - 1).reduce(
      (p, i) => new Rotator(d, phi[i], 0, i + 1).fn(p),
      root
    );
  };
}
