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
  private x: Vector;
  private y: Vector;
  constructor(readonly fns: Fn[]) {
    this.x = new Float32Array(this.domainMax);
    this.y = new Float32Array(this.dMax);

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

  sample = function* (this: CompositeFn, n: number) {
    const { fns } = this;
    if (fns.length == 0) return [];

    const composite = new CompositeFn(fns.slice(1));
    for (const x of fns[0].sample(n)) {
      yield composite.fn(x);
    }
  };

  sampleInto = (n: number, data: Float32Array) => {
    const { d, fns } = this;
    assert.equal(data.length, n * d);
    if (fns.length == 0) return [];

    const composite = new CompositeFn(fns.slice(1));
    let offset = 0;
    for (const x of fns[0].sample(n)) {
      composite.fn(x, data.subarray(offset, offset + d));
      offset += d;
    }
  };

  fn = (x: Vector, y: Vector = new Float32Array(this.d)) => {
    const { fns, domain, d } = this;
    assert.equal(x.length, domain);
    assert.equal(y.length, d);

    if (x.length !== this.domain) {
      throw new Error(
        `Input vector ${x} invalid for composite with domain ${this.domain}`,
      );
    }

    this.x.set(x);
    for (const f of fns) {
      f.fn(this.x.subarray(0, f.domain), this.y.subarray(0, f.d));
      this.x.fill(0);
      this.x.set(this.y.subarray(0, this.domainMax));
    }
    y.set(this.y.subarray(0, d));
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
