import assert from 'assert';
import { Data, Vector } from '../data';
import { CompositeFn } from '../fn';
import { HSV } from '../params';
import { Scope } from '../params/scope';
import { PipeNode, Scalar } from './grammar.pegjs';
import { Resolver } from './resolver';
import { Chunk } from './types';

const { abs, min, sign } = Math;

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
  private readonly fn: CompositeFn;
  private readonly offset: number;
  private readonly limit: number;
  private readonly resolver: Resolver;

  constructor(
    private readonly scope: Scope,
    ast: PipeNode,
    private readonly hsv: HSV,
    chunk: Chunk
  ) {
    this.resolver = new Resolver(scope);
    const { n, fn } = this.resolvePipe(ast);
    const offset = chunk.offset;
    const size = chunk.size;
    const limit = offset + size;
    assert(offset >= 0, `offset must be non-negative; got ${offset}`);
    assert(
      limit <= n,
      `offset + size must be <= n; got ${offset} + ${size} = ${limit} > ${n}`
    );

    this.n = n;
    this.fn = fn;
    this.offset = offset;
    this.limit = limit;
  }

  private get d() {
    return this.fn.d;
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

  iterate = (buffer: SharedArrayBuffer) => {
    const { d, offset, limit } = this;
    const data = new Float32Array(buffer);
    const position = this.computePosition(data);
    const color = this.computeColor(data, position);

    return {
      position: position.subarray(d * offset, d * limit),
      color: color.subarray(3 * offset, 3 * limit)
    };
  };

  private computePosition = (data: Vector) => {
    const { fn, n, d, offset, limit } = this;
    const position = Data.position(data);

    let i = offset;
    for (const y of fn.sample(n, offset, limit)) {
      Data.set(position, y, i++, fn.d);
    }

    return position;
  };

  private computeColor = (data: Vector, position: Vector) => {
    const { d, hsv, offset, limit } = this;
    const color = Data.color(data);
    const { extent } = this.scope;

    for (let i = offset; i < limit; i++) {
      const p = Data.get(position, i, d);
      this.scope.p = p.map((pk, k) => {
        const m = extent[k];
        return m ? sign(pk) * min(1, abs(pk) / m) : 0;
      });
      this.scope.i = i;
      const h = 360 * this.resolveNumber('h', hsv.h);
      const s = this.resolveNumber('s', hsv.s);
      const v = this.resolveNumber('v', hsv.v);
      const rgb = hsv2rgb(h, s, v);

      color.set(rgb, i * 3);
    }

    return color;
  };
}

function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  // source: https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
  h = Math.max(0, Math.min(360, h));
  s = Math.max(0, Math.min(1, s));
  v = Math.max(0, Math.min(1, v));

  const hprime = h / 60;
  const c = v * s;
  const x = c * (1 - abs((hprime % 2) - 1));
  const m = v - c;
  let rgb: [number, number, number];

  if (hprime <= 1) {
    rgb = [c, x, 0];
  } else if (hprime <= 2) {
    rgb = [x, c, 0];
  } else if (hprime <= 3) {
    rgb = [0, c, x];
  } else if (hprime <= 4) {
    rgb = [0, x, c];
  } else if (hprime <= 5) {
    rgb = [x, 0, c];
  } else if (hprime <= 6) {
    rgb = [c, 0, x];
  } else {
    rgb = [0, 0, 0];
  }

  rgb.forEach((vi, i) => (rgb[i] = vi + m));

  return rgb;
}
