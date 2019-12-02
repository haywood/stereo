import {zeros, size} from 'mathjs';
import memoize from 'memoizee';

export const cos = memoize(Math.cos);
export const sin = memoize(Math.sin);
export const tan = memoize(Math.tan);
export const tanh = memoize(Math.tanh);
export const exp = Math.exp;

export const components = (d) => Array.from(new Array(d).keys());

export interface Fn {
  readonly d: number;
  readonly domain: number;
  fn(x: number[]): number[];
  sample(n: number): Generator<number[]>;
}

export class CompositeFn implements Fn {
  private readonly fns: Fn[] = [];

  constructor(readonly domain: number) {}

  get last() {
    return this.fns[this.fns.length - 1];
  }

  get d() {
    const fn = this.last;
    return (fn && fn.d) || this.domain;
  }

  add = (fn: Fn) => {
    const {fns} = this;
    if (fns.length && fn.domain !== this.d) {
      throw new Error(
          `Cannot add ${fn} to pipeline, because its domain is not ${this.d}`,
      );
    }
    fns.push(fn);
  };

  sample = function* (this: CompositeFn, n: number) {
    const {fns} = this;
    if (fns.length == 0) return [];

    for (const p of fns[0].sample(n)) {
      yield fns.slice(1).reduce((p, fn) => fn.fn(p), p);
    }
  };

  fn = (x: number[]): number[] => {
    const {fns} = this;

    if (x.length !== this.domain) {
      throw new Error(
          `Input vector ${x} invalid for composite with domain ${this.domain}`,
      );
    }

    return fns.reduce((y, fn) => fn.fn(y), x);
  };
}
