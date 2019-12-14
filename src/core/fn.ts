import { TypedArray } from "three";

export const cos = Math.cos;
export const sin = Math.sin;
export const tan = Math.tan;
export const tanh = Math.tanh;
export const exp = Math.exp;

export const components = (d) => Array.from(new Array(d).keys());

export interface Fn {
  readonly d: number;
  readonly domain: number;
  fn(x: ArrayLike<number>, y?: ArrayLike<number>): ArrayLike<number>;
  sample(n: number): Generator<ArrayLike<number>>;
}

export class CompositeFn implements Fn {
  constructor(readonly fns: Fn[]) { }

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

  sample = function* (this: CompositeFn, n: number) {
    const { fns } = this;
    if (fns.length == 0) return [];

    for (const p of fns[0].sample(n)) {
      yield fns.slice(1).reduce((p, fn) => fn.fn(p), p);
    }
  };

  fn = (x: ArrayLike<number>) => {
    const { fns } = this;

    if (x.length !== this.domain) {
      throw new Error(
        `Input vector ${x} invalid for composite with domain ${this.domain}`,
      );
    }

    return fns.reduce((y, fn) => fn.fn(y), x);
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
    };

    build = () => {
      return new CompositeFn(this.fns);
    };
  };
}
