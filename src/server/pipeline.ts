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
import { Color } from 'three';
import { getLogger, Logger } from 'loglevel';
import Stereo from './stereo';

const logger = getLogger('Pipeline');

const f = (expr: string): (x: number) => number => {
  const fnc = math.compile(expr);
  return (phi: number) => fnc.evaluate({ phi });
};

const newPipe = (
  spec: string,
  scope: {
    rate?: number,
    t?: number,
    f0?: (x: number) => number,
    f1?: (x: number) => number
  } = {},
  d?: number
) => {
  const parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(spec);
  const tree: { domain: number, mappings: any[] } = parser.results[0];
  logger.debug(`parsed spec ${spec} into ${JSON.stringify(tree, null, 2)}`);

  let pipe: CompositeFn;
  if (d != null) {
    pipe = new CompositeFn(d);
  } else if (tree.domain) {
    pipe = new CompositeFn(tree.domain);
  } else {
    pipe = new CompositeFn(1);
  }

  const iter = tree.mappings.values();
  let cursor = iter.next();
  while (!cursor.done) {
    const { fn, ...params } = cursor.value;

    if (fn === 'sphere') {
      const { r } = params;
      pipe.add(new Sphere(pipe.d + 1, r));
    } else if (fn === 'spiral') {
      const { a, k } = params;
      pipe.add(new Spiral(pipe.d + 1, a, new Array(pipe.d).fill(k)));
    } else if (fn === 'torus') {
      const { r, t } = params;
      pipe.add(new Torus(pipe.d + 1, r, t));
    } else if (fn === 'fucked_up_torus') {
      const { r, t } = params;
      pipe.add(new FuckedUpTorus(pipe.d + 1, r, t));
    } else if (fn === 'R') {
      const rotations = [];
      while (!cursor.done && cursor.value.fn === 'R') {
        const { phiSpec, d0, d1 } = cursor.value;
        const phi: number = math.evaluate(phiSpec, {
          ...scope,
          d: pipe.d,
        });
        rotations.push({ phi, d0, d1 });
        cursor = iter.next();
      }
      pipe.add(new Rotator(pipe.d, rotations, scope.f0, scope.f1));
      continue;
    } else if (fn === 'stereo') {
      const { to } = params;
      pipe.add(new Stereo(pipe.d, to));
    }
    cursor = iter.next();
  }

  logger.debug(`initialized pipe:\n${JSON.stringify(pipe, null, 2)}`);

  return pipe;
};

export class Pipeline {
  private readonly seeds: number[][];
  private readonly n: number;
  private readonly logger: Logger;

  constructor(readonly nSpec: string, readonly seedSpec: string) {
    // good ones
    // 2 -> sphere -> spiral
    // 2 -> sphere -> spiral -> (fucked_up_)?torus
    // 3 -> sphere
    // 3 -> (fucked_up_)?torus (interesting)
    // 3 -> spiral (really good)
    // 3 -> sphere -> sphere
    // 2 -> 3 * sphere

    this.logger = getLogger(`${Pipeline}(${nSpec}, ${seedSpec}})`);
    const seeder = newPipe(seedSpec);
    this.n = math.evaluate(nSpec);
    if (this.n < 1) throw new Error("can't run an empty pipeline");

    this.logger.info(`creating seeds from seeder`, seeder);
    const start = Date.now();
    this.seeds = Array.from(seeder.sample(this.n));
    this.logger.info(`generated ${this.seeds.length} seed points in ${Date.now() - start}ms`);
  }

  get d() {
    return this.seeds[0].length;
  }

  run = (
    t: number,
    rate: number,
    f0Spec: string,
    f1Spec: string,
    hueSpec: string,
    lightnessSpec: string,
    pipeSpec: string,
  ) => {
    this.logger.info('generating data from parameters', { t, rate, f0Spec, f1Spec, hueSpec, lightnessSpec, pipeSpec });

    const { seeds, n } = this;
    const seconds = t / 1000;
    const f0 = f(f0Spec);
    const f1 = f(f1Spec);
    const hueFn = math.compile(`360 * (${hueSpec})`);
    const lightnessFn = math.compile(`100 * (${lightnessSpec})`);
    const pipe = newPipe(pipeSpec, { rate, t: seconds }, this.d);

    const points = seeds.map(pipe.fn);
    const pointColors = points.map((p, i) => {
      const hue = hueFn.evaluate({ t: seconds, p, i, n });
      const lightness = math.round(lightnessFn.evaluate({ t: seconds, p, i, n }), 0);
      const color = new Color(`hsl(${hue}, 100%, ${lightness}%)`);
      return [color.r, color.g, color.b];
    });

    const position = flatten(points);
    const color = flatten(pointColors);
    const d = pipe.d;
    return { position, color, d };
  };
}
