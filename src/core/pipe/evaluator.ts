import assert from 'assert';
import { hsv } from 'color-convert';
import { getLogger } from 'loglevel';

import { Data, Vector } from '../data';
import { CompositeFn } from '../fn/fn';
import { pp } from '../pp';

import { PipeNode } from './ast';
import { Resolution, Resolver } from './resolver';
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
    chunk: Chunk,
  ) {
    const resolver = new Resolver(scope);
    const { n, staticFn, dynamicFn } = resolver.resolve(ast);
    const offset = chunk.offset;
    const size = chunk.size;
    const limit = offset + size;
    assert(offset >= 0, `offset must be non-negative; got ${offset}`);
    assert(
      limit <= n,
      `offset + size must be <= n; got ${offset} + ${size} = ${limit} > ${n}`,
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
      'd(data) != d(evaluator)',
    );

    logger.debug(`iterating using ${pp(scope)}, ${pp(iter)}`);
    for (let i = offset; i < limit; i++) {
      iter.fn(Data.get(input, i, init.d), Data.get(position, i, iter.d));
    }

    position.forEach((p, i) => {
      assert(!isNaN(p), `Found NaN in position at index ${i}.`);
    });

    this.computeColors(data);

    logger.debug(`iteration complete in ${Date.now() - start}ms`);
  };

  private computeColors = (data: Vector) => {
    logger.debug(`computing colors`);
    const { d, hv, offset, limit, resolver } = this;
    const position = Data.position(data);
    const color = Data.color(data);

    this.scope.max = position.reduce((max, p) => Math.max(max, Math.abs(p)), 0);

    for (let i = offset; i < limit; i++) {
      const p = Data.get(position, i, d);
      this.scope.p = p;
      this.scope.i = i;
      const rgb = hsv.rgb([
        Math.round(resolver.resolve(hv.h, 'number')),
        100,
        Math.round(resolver.resolve(hv.v, 'number')),
      ]);

      Data.set(color, rgb || [1, 1, 1], i, 3);
    }
  };
}
