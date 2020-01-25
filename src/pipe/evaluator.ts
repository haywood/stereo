import assert from 'assert';
import { CompositeFn } from '../fn';
import { HSV } from '../params';
import { Scope } from '../params/scope';
import { Vector } from '../types';
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
  private readonly size: number;
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
    this.size = limit - offset;
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

  iterate = () => {
    const position = this.computePosition();
    const color = this.computeColor(position);

    return {
      d: this.d,
      position,
      color
    };
  };

  private computePosition = () => {
    const { fn, n, d, offset, size } = this;
    const position = new Float32Array(d * size);

    let i = 0;
    for (const y of fn.sample(n, offset, offset + size)) {
      position.set(y, d * i++);
    }

    return position;
  };

  private computeColor = (position: Vector) => {
    const { d, hsv, size } = this;
    const color = new Float32Array(3 * size);
    const { extent } = this.scope;

    for (let i = 0; i < size; i++) {
      const p = position.subarray(i * d, (i + 1) * d);
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
