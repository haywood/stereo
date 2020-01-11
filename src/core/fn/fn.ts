import { Vector } from '../data';
import assert from 'assert';
import { inf } from '../constants';

export const cos = Math.cos;
export const sin = Math.sin;
export const tan = Math.tan;
export const tanh = Math.tanh;
export const exp = Math.exp;

export const components = d => Array.from(new Array(d).keys());

export interface Fn {
  readonly d: number;
  readonly domain: number;
  fn(x: Vector, y?: Vector): Vector;
  sample(n: number, offset: number, limit: number): Generator<Vector>;
}

export class CompositeFn implements Fn {
  private readonly x: Vector;
  private readonly y: Vector;
  constructor(readonly fns: Fn[]) {
    assert(fns.length, 'fns cannot be empty');

    const length = Math.max(this.domainMax, this.dMax);
    this.x = new Float32Array(length);
    this.y = new Float32Array(length);
  }

  get first() {
    return this.fns[0];
  }

  get last() {
    return this.fns[this.fns.length - 1];
  }

  get domain() {
    return this.first.domain;
  }

  get d() {
    return this.last.d;
  }

  get domainMax() {
    return this.fns.reduce((max, f) => Math.max(f.domain, max), 0);
  }

  get dMax() {
    return this.fns.reduce((max, f) => Math.max(f.d, max), 0);
  }

  sample = function*(n: number, offset: number, limit: number) {
    const { fns, d } = this;
    const [first, ...rest] = fns;
    if (fns.length == 0) return [];

    for (const x of first.sample(n, offset, limit)) {
      this.x.set(x);
      if (rest.length) {
        CompositeFn.apply(rest, this.x, this.y);
      } else {
        this.y.set(x);
      }
      yield this.y.subarray(0, d);
    }
  };

  fn = (x: Vector, y: Vector = new Float32Array(this.d)) => {
    const { fns, domain, d } = this;
    assert.equal(x.length, domain);
    assert.equal(y.length, d);

    this.x.set(x);
    CompositeFn.apply(fns, this.x, this.y);
    y.set(this.y.subarray(0, d));
    return y;
  };

  private static apply = (fns: Fn[], x: Vector, y: Vector) => {
    assert.equal(x.length, y.length);
    for (const f of fns) {
      f.fn(x.subarray(0, f.domain), y.subarray(0, f.d));
      for (let i = 0; i < y.length; i++) {
        if (!isFinite(y[i])) y[i] = Math.sign(y[i]) * inf;
      }
      x.set(y);
    }
  };

  static Builder = class {
    private readonly fns: Fn[] = [];

    get d() {
      return this.last.d;
    }

    get last() {
      return this.fns[this.fns.length - 1];
    }

    add = (fn: Fn) => {
      const { fns, last } = this;
      if (last && fn.domain !== last.d) {
        throw new Error(
          `Cannot add ${fn} to composite, because its domain is not ${last.d}`,
        );
      }
      fns.push(fn);
      return this;
    };

    build = () => {
      return new CompositeFn(this.fns);
    };
  };
}
