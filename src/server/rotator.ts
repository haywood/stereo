import {multiply, identity, format, index, Matrix} from 'mathjs';
import {Fn, cos, sin} from './fn';
import Cube from './cube';

interface Rotation {
  readonly phi: number;
  readonly d0: number;
  readonly d1: number;
}

export default class Rotator implements Fn {
  private readonly R;

  constructor(
    readonly d: number,
    readonly rotations: Rotation[],
    readonly f0 = cos,
    readonly f1 = sin,
  ) {
    this.R = rotations.map(this.newR).reduce((a, b) => multiply(a, b), identity(d));
  }

  private newR = ({phi, d0, d1}) => {
    const {d, f0, f1} = this;
    if (d0 < 0 || d1 < 0 || d0 > d || d1 > d) {
      throw new Error(`invalid rotation specified for dimension ${d}`);
    }

    let R = identity(d) as Matrix;
    const r0 = f0(phi);
    const r1 = f1(phi);
    R.subset(index(d0, [d0, d1]), [r0, -r1]);
    R.subset(index(d1, [d0, d1]), [r1, r0]);

    return R;
  }

  get domain() {
    return this.d;
  }

  sample = function* (this: Rotator, n: number) {
    const cube = new Cube(this.domain, 2);
    for (const p of cube.sample(n)) {
      yield this.fn(p);
    }
  };

  fn(p: number[]) {
    return multiply(this.R, p).valueOf() as number[];
  }
}
