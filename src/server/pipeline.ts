import Sphere from './sphere';
import Spiral from './spiral';
import Torus from './torus';
import FuckedUpTorus from './fucked_up_torus'
import { ones, flatten } from 'mathjs';
import Projector from './stereo';
import Rotator from './rotator';
import { CompositeFn, components } from './fn';
import * as math from 'mathjs';
import * as grammar from './composite_fn';
import { Parser, Grammar } from 'nearley';

const f = (expr: string): (x: number) => number => {
  const fnc = math.compile(expr);
  return (phi: number) => fnc.evaluate({ phi });
};

export class Pipeline {
  private readonly seeds: number[][];
  private readonly n: number;

  constructor(readonly nSpec: string, readonly seedSpec: string) {
    // good ones
    // 2 -> sphere -> spiral
    // 2 -> sphere -> spiral -> (fucked_up_)?torus
    // 3 -> sphere
    // 3 -> (fucked_up_)?torus (interesting)
    // 3 -> spiral (really good)
    // 3 -> sphere -> sphere
    // 2 -> 3 * sphere

    const parser = new Parser(Grammar.fromCompiled(grammar));
    parser.feed(seedSpec);
    const result = parser.results[0];
    console.info(`initializing seeder from the following expression tree: ${JSON.stringify(parser.results[0], null, 2)}`);
    const seeder = new CompositeFn(result.domain);

    for (const { fn, ...params } of result.mappings) {
      if (fn === 'sphere') {
        const { r } = params;
        seeder.add(new Sphere(seeder.d + 1, r));
      } else if (fn === 'spiral') {
        const { a, k } = params;
        seeder.add(new Spiral(seeder.d + 1, a, new Array(seeder.d).fill(k)));
      } else if (fn === 'torus') {
        const { r, t } = params;
        seeder.add(new Torus(seeder.d + 1, r, t));
      } else if (fn === 'fucked_up_torus') {
        const { r, t } = params;
        seeder.add(new FuckedUpTorus(seeder.d + 1, r, t));
      }
    }
    this.n = math.evaluate(nSpec);
    if (this.n < 1) throw new Error("can't run an empty pipeline");

    console.info(`creating seeds from seeder`, seeder);
    const start = Date.now();
    this.seeds = Array.from(seeder.sample(this.n));
    console.info(`generated ${this.seeds.length} seed points in ${Date.now() - start}ms`);
  }

  get d() {
    return this.seeds[0].length;
  }

  run = (t: number, rate: number, f0Spec: string, f1Spec: string, colorSpec: { r: string, g: string, b: string }) => {
    console.info('generating data from parameters', { t, rate, f0Spec, f1Spec, colorSpec });

    const { seeds: seed } = this;
    const pipe = new CompositeFn(this.d);
    const seconds = t / 1000;
    const f0 = f(f0Spec);
    const f1 = f(f1Spec);
    const rFn = math.compile(colorSpec.r);
    const gFn = math.compile(colorSpec.g);
    const bFn = math.compile(colorSpec.b);

    pipe.add(
      new Rotator(
        pipe.d,
        components(pipe.d - 1)
          .map((i) => ({ phi: rate * seconds, d0: 0, d1: i + 1 })),
        f0,
        f1
      )
    );
    pipe.add(new Projector(pipe.d, 3));

    const points = seed.map(pipe.fn);
    const pointColors = points.map((p, i) => [
      rFn.evaluate({ t: seconds, p, i, x: p[0] }),
      gFn.evaluate({ t: seconds, p, i, x: p[1] }),
      bFn.evaluate({ t: seconds, p, i, x: p[2] })
    ]);
    const position = flatten(points);
    const color = flatten(pointColors);
    const d = pipe.d;
    return { position, d, color };
  };
}
