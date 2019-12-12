import { flatten } from 'mathjs';
import * as math from 'mathjs';
import { Color } from 'three';
import { getLogger, Logger, setDefaultLevel } from 'loglevel';
import { Data } from '../data';
import { Pipe } from './pipe';

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
  color?: string;
  h?: string;
  l?: string;
  pipe?: string;
}

const cache = new Map<string, Pipeline>();

export const runPipeline = (params: Params) =>
  getPipeline(params).run(params);

export const getPipeline = (params: Params): Pipeline => {
  // TODO: use only static portion of pipeline for cache key
  const key = JSON.stringify({ n: params.n, pipe: params.pipe });
  logger.debug(`pipeline cache has the following keys`, [...cache.keys()])
  if (!cache.has(key)) {
    logger.warn(`key ${key} not found. creating new pipeline from params
${JSON.stringify(params, null, 2)}`)
    cache.set(key, new Pipeline(params));
  }
  return cache.get(key);
}

export class Pipeline {
  private readonly seeds: number[][];
  private readonly n: number;
  private readonly logger: Logger;

  constructor(params: Params) {
    // good ones
    // 2 -> sphere -> spiral
    // 2 -> sphere -> spiral -> (fucked_up_)?torus
    // 3 -> sphere
    // 3 -> (fucked_up_)?torus (interesting)
    // 3 -> spiral (really good)
    // 3 -> sphere -> sphere
    // 2 -> 3 * sphere

    this.logger = getLogger(`${Pipeline}(${params.n}, ${params.pipe}})`);

    this.n = math.evaluate(params.n || '4096');
    const { init } = this.getPipes(params);
    if (this.n < 1) throw new Error("can't run an empty pipeline");

    this.logger.info(`creating seeds from seeder
${JSON.stringify(init, null, 2)}`);

    const start = Date.now();
    this.seeds = Array.from(init.sample(this.n));
    this.logger.info(`generated ${this.seeds.length} seed points in ${Date.now() - start}ms`);
  }

  get d() {
    return this.seeds[0].length;
  }

  getPipes = (params: Params) => {
    const rate = math.evaluate(params.rate);
    const t = rate * params.t / 1000;
    const f0 = f(params.f0);
    const f1 = f(params.f1);
    const n = this.n;

    return Pipe.parse(
      params.pipe || '3->sphere(1)->R(t, 0, 1)->stereo(3)',
      { n, t, f0, f1 }
    );
  }

  run = (params: Params): Data => {
    this.logger.debug('generating data from parameters', params);

    const rate = math.evaluate(params.rate);
    const { seeds, n } = this;
    const seconds = rate * params.t / 1000;
    const hueFn = math.compile(`360 * (${params.h})`);
    const lightnessFn = math.compile(`100 * (${params.l})`);
    const { iter } = this.getPipes(params);

    const points = iter ? seeds.map(iter.fn) : seeds;
    const pointColors = points.map((p, i) => {
      const hue = hueFn.evaluate({ t: seconds, p, i, n });
      const lightness = math.round(lightnessFn.evaluate({ t: seconds, p, i, n }), 0);
      const color = new Color(`hsl(${hue}, 100%, ${lightness}%)`);
      return [color.r, color.g, color.b];
    });

    const position = flatten(points) as number[];
    const color = flatten(pointColors) as number[];
    const d = iter.d;
    return { position, color, d };
  };
}