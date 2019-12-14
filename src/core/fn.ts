import { TypedArray } from "three";
import { Vector } from "./data";
import assert from 'assert';

export const cos = Math.cos;
export const sin = Math.sin;
export const tan = Math.tan;
export const tanh = Math.tanh;
export const exp = Math.exp;

export const components = (d) => Array.from(new Array(d).keys());

export interface Fn {
  readonly d: number;
  readonly domain: number;
  fn(x: Vector, y?: Vector): Vector;
  sample(n: number): Generator<Vector>;
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

  fn = (x: Vector, y: Float32Array = new Float32Array(this.d)) => {
    const { fns, domain, d } = this;
    assert.equal(x.length, domain);
    assert.equal(y.length, d);

    if (x.length !== this.domain) {
      throw new Error(
        `Input vector ${x} invalid for composite with domain ${this.domain}`,
      );
    }

    const domainMax = fns.reduce((max, f) => Math.max(f.domain, max), 0);
    const dMax = fns.reduce((max, f) => Math.max(f.d, max), 0);
    const xTemp = new Float32Array(domainMax);
    const yTemp = new Float32Array(dMax);
    xTemp.set(x);

    for (const f of fns) {
      f.fn(xTemp.subarray(0, f.domain), yTemp.subarray(0, f.d));
      xTemp.fill(0);
      xTemp.set(yTemp.subarray(0, domainMax));
    }
    y.set(yTemp.subarray(0, d));
    return y;
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
