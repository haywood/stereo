import assert from 'assert';

import { getLogger } from 'loglevel';

import { Data, Vector } from '../data';
import { CompositeFn } from '../fn';
import { pp } from '../pp';
import { PipeNode } from './grammar.pegjs';
import { Resolver } from './resolver';
import { Chunk, HV, Scope } from './types';

const logger = getLogger('Evaluator');

export class Evaluator {
  private readonly n: number;
  private readonly staticFn: CompositeFn;
  private readonly dynaicFn: CompositeFn;
  private readonly offset: number;
  private readonly limit: number;
  private readonly resolver: Resolver;

  constructor(
    private readonly scope: Scope,
    ast: PipeNode,
    private readonly hv: HV,
    chunk: Chunk
  ) {
    const resolver = new Resolver(scope);
    const { n, staticFn, dynamicFn } = resolver.resolve(ast);
    const offset = chunk.offset;
    const size = chunk.size;
    const limit = offset + size;
    assert(offset >= 0, `offset must be non-negative; got ${offset}`);
    assert(
      limit <= n,
      `offset + size must be <= n; got ${offset} + ${size} = ${limit} > ${n}`
    );

    this.n = n;
    this.staticFn = staticFn;
    this.dynaicFn = dynamicFn;
    this.offset = offset;
    this.limit = limit;
    this.resolver = resolver;
  }

  private get d() {
    return this.dynaicFn.d;
  }

  initialize = (buffer: SharedArrayBuffer): void => {
    const data = new Float32Array(buffer);
    const { n, staticFn: init, offset, limit } = this;
    const input = Data.input(data);
    let i = offset;
    for (const y of init.sample(n, offset, limit)) {
      Data.set(input, y, i++, init.d);
    }
  };

  iterate = (buffer: SharedArrayBuffer): void => {
    const data = new Float32Array(buffer);
    const { staticFn: init, dynaicFn: iter, scope, n, offset, limit } = this;
    const input = Data.input(data);
    const position = Data.position(data);
    const start = Date.now();

    assert.equal(data[Data.nOffset], n, `n(data) != n(evaluator)`);
    assert.equal(data[Data.inputOffset], init.d, `d0(data) != d0(evaluator)`);
    assert.equal(
      data[Data.positionOffset(data)],
      iter.d,
      'd(data) != d(evaluator)'
    );

    logger.debug(`iterating using ${pp(scope)}, ${pp(iter)}`);
    for (let i = offset; i < limit; i++) {
      iter.fn(Data.get(input, i, init.d), Data.get(position, i, iter.d));
    }

    this.computeColors(data);

    logger.debug(`iteration complete in ${Date.now() - start}ms`);
  };

  private computeColors = (data: Vector) => {
    logger.debug(`computing colors`);
    const { d, hv, offset, limit, resolver } = this;
    const position = Data.position(data);
    const color = Data.color(data);

    for (let i = offset; i < limit; i++) {
      const p = Data.get(position, i, d);
      this.scope.p = p;
      this.scope.i = i;
      const h = Math.round(360 * resolver.resolve(hv.h, 'number'));
      const v = Math.round(resolver.resolve(hv.v, 'number'));

      Data.set(color, hsv2rgb(h, v), i, 3);
    }
  };
}

function hsv2rgb(h: number, v: number): [number, number, number] {
  // source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
  assert(0 <= h && h <= 360, `hsv2rgb: expected 0 <= h = ${h} <= 360`);
  assert(0 <= v && v <= 1, `hsv2rgb: expected 0 <= v = ${v} <= 1`);

  const hprime = h / 60;
  const c = v; // saturation fixed at 1
  const x = c * (1 - Math.abs((hprime % 2) - 1));

  if (hprime <= 1) {
    return [c, x, 0];
  } else if (hprime <= 2) {
    return [x, c, 0];
  } else if (hprime <= 3) {
    return [0, c, x];
  } else if (hprime <= 4) {
    return [0, x, c];
  } else if (hprime <= 5) {
    return [x, 0, c];
  } else if (hprime <= 6) {
    return [c, 0, x];
  }
}
