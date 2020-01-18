import assert from 'assert';
import { Data, Vector } from '../data';
import { CompositeFn } from '../fn';
import { PipeNode, Scalar } from './grammar.pegjs';
import { Resolver } from './resolver';
import { Scope } from './scope';
import { Chunk, HV } from './types';

const { abs, min, round, sign } = Math;

export class EvaluationError extends Error {
  constructor(readonly context: string, readonly cause: Error) {
    super(cause?.message);
  }

  get name() {
    return 'EvaluationError';
  }
}

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
    this.resolver = new Resolver(scope);
    const { n, staticFn, dynamicFn } = this.resolvePipe(ast);
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
  }

  private get d() {
    return this.dynaicFn.d;
  }

  private resolvePipe(node: PipeNode) {
    try {
      return this.resolver.resolve(node);
    } catch ({ message, scope }) {
      throw { context: 'pipe', message, scope };
    }
  }

  private resolveNumber(context: string, node: Scalar) {
    try {
      return this.resolver.resolve(node, 'number');
    } catch ({ message, scope }) {
      throw { context, message, scope };
    }
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

    assert.equal(data[Data.nOffset], n, `n(data) != n(evaluator)`);
    assert.equal(data[Data.inputOffset], init.d, `d0(data) != d0(evaluator)`);
    assert.equal(
      data[Data.positionOffset(data)],
      iter.d,
      'd(data) != d(evaluator)'
    );

    for (let i = offset; i < limit; i++) {
      iter.fn(Data.get(input, i, init.d), Data.get(position, i, iter.d));
    }

    this.computeColors(data);
  };

  private computeColors = (data: Vector) => {
    const { d, hv, offset, limit, resolver } = this;
    const position = Data.position(data);
    const color = Data.color(data);
    const { extent } = this.scope;

    for (let i = offset; i < limit; i++) {
      const p = Data.get(position, i, d);
      this.scope.p = p.map((pk, k) => {
        const m = extent[k];
        return m ? sign(pk) * min(1, abs(pk) / m) : 0;
      });
      this.scope.i = i;
      const h = 360 * this.resolveNumber('h', hv.h);
      const v = this.resolveNumber('v', hv.v);
      const rgb = hsv2rgb(h, v);

      color.set(rgb, i * 3);
    }
  };
}

function hsv2rgb(h: number, v: number): [number, number, number] {
  // source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
  h = Math.max(0, Math.min(360, h));
  v = Math.max(0, Math.min(1, v));

  const hprime = h / 60;
  const c = v; // saturation fixed at 1
  const x = c * (1 - abs((hprime % 2) - 1));

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
