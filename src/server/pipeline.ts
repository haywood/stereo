import Sphere from './sphere';
import Spiral from './spiral';
import Torus from './torus';
import { pi, ones } from 'mathjs';
import Projector from './stereo';
import Rotator from './rotator';
import { CompositeFn, components } from './fn';
import { flatten } from 'mathjs';

export class Pipeline {
  private readonly seed: number[][];

  constructor(readonly n: number, readonly rate: number) {
    if (n < 1) throw new Error("can't run an empty pipeline");

    // good ones
    // 2 -> sphere -> spiral
    // 2 -> sphere -> spiral -> (fucked_up_)?torus
    // 3 -> sphere
    // 3 -> (fucked_up_)?torus (interesting)
    // 3 -> spiral (really good)
    // 3 -> sphere -> sphere
    // 2 -> 3 * sphere

    const seeder = new CompositeFn(2);
    const sphere = () => new Sphere(seeder.d + 1, 1);
    const spiral = () => new Spiral(seeder.d + 1, 1, ones(seeder.d).valueOf() as number[]);
    const torus = () => new Torus(seeder.d + 1, 1, 0.25);

    seeder.add(sphere());
    seeder.add(spiral());
    seeder.add(torus());
    this.seed = Array.from(seeder.sample(n));
  }

  get d() {
    return this.seed[0].length;
  }

  run = (t) => {
    const { seed, rate } = this;
    const pipe = new CompositeFn(this.d);
    const seconds = t / 1000;
    pipe.add(
      new Rotator(
        pipe.d,
        components(pipe.d - 1)
          .map((i) => ({ phi: rate * seconds, d0: 0, d1: i + 1 })))
    );
    pipe.add(new Projector(pipe.d, 3));
    pipe.add(new Rotator(pipe.d, [{ phi: pi / 5, d0: 1, d1: 2 }]));

    const position = flatten(seed.map(pipe.fn));
    const d = pipe.d;
    return { position, d };
  };
}
