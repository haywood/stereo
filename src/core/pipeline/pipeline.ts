import Sphere from '../sphere';
import Spiral from '../spiral';
import Torus from '../torus';
import FuckedUpTorus from '../fucked_up_torus'
import { flatten } from 'mathjs';
import Rotator from '../rotator';
import { CompositeFn } from '../fn';
import * as math from 'mathjs';
import * as grammar from '../composite_fn.grammar';
import { Parser, Grammar } from 'nearley';
import { Color } from 'three';
import { getLogger, Logger, setDefaultLevel } from 'loglevel';
import Stereo from '../stereo';
import { Data } from '../data';

setDefaultLevel('info');
const logger = getLogger('Pipeline');

const f = (expr: string): (x: number) => number => {
  const fnc = math.compile(expr);
  return (phi: number) => fnc.evaluate({ phi });
};

export type Params = {
  n?: string;
  t?: number;
  rate?: string;
  f0?: string;
  f1?: string;
  seed?: string;
  color?: string;
  h?: string;
  l?: string;
  pipe?: string;
}

const cache = new Map<string, Pipeline>();

export const runPipeline = (params: Params) =>
  getPipeline(params).run(params);

export type PipelineRunner = typeof runPipeline;

export const getPipeline = (params: Params): Pipeline => {
  const key = JSON.stringify({ n: params.n, seed: params.seed });
  logger.debug(`pipeline cache has the following keys`, [...cache.keys()])
  if (!cache.has(key)) {
    logger.warn(`key ${key} not found. creating new pipeline from params
${JSON.stringify(params, null, 2)}`)
    cache.set(key, Pipeline.create(params));
  }
  return cache.get(key);
}

export class Pipeline {
  private readonly seeds: number[][];
  private readonly n: number;
  private readonly logger: Logger;

  static create = (params: Params) => {
    const nSpec: string = params.n || '4096';
    const seedSpec = params.seed || '3->sphere(1)';
    return new Pipeline(nSpec, seedSpec);
  };

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

    this.logger.info(`creating seeds from seeder
${JSON.stringify(seeder, null, 2)}`);

    const start = Date.now();
    this.seeds = Array.from(seeder.sample(this.n));
    this.logger.info(`generated ${this.seeds.length} seed points in ${Date.now() - start}ms`);
  }

  get d() {
    return this.seeds[0].length;
  }

  run = (params: Params): Data => {
    this.logger.debug('generating data from parameters', params);

    const rate = math.evaluate(params.rate);
    const { seeds, n } = this;
    const seconds = rate * params.t / 1000;
    const f0 = f(params.f0);
    const f1 = f(params.f1);
    const hueFn = math.compile(`360 * (${params.h})`);
    const lightnessFn = math.compile(`100 * (${params.l})`);
    const pipe = newPipe(params.pipe, { t: seconds, f0, f1 }, this.d);

    const points = seeds.map(pipe.fn);
    const pointColors = points.map((p, i) => {
      const hue = hueFn.evaluate({ t: seconds, p, i, n });
      const lightness = math.round(lightnessFn.evaluate({ t: seconds, p, i, n }), 0);
      const color = new Color(`hsl(${hue}, 100%, ${lightness}%)`);
      return [color.r, color.g, color.b];
    });

    const position = flatten(points) as number[];
    const color = flatten(pointColors) as number[];
    const d = pipe.d;
    return { position, color, d };
  };
}

const newPipe = (
  spec: string,
  scope: {
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
    const d = pipe.d + 1;

    if (fn === 'sphere') {
      const { r } = params;
      pipe.add(new Sphere(pipe.d + 1, r));
    } else if (fn === 'spiral') {
      const a = new Array(d).fill(params.a);
      const k = new Array(d - 1).fill(params.k);
      pipe.add(new Spiral(d, a, k));
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

  logger.debug(`initialized pipe:
${JSON.stringify(pipe, null, 2)}`);

  return pipe;
};