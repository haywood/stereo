import assert from 'assert';

import Cube from '../fn/cube';
import { CompositeFn, Fn } from '../fn/fn';
import FuckedUpTorus from '../fn/fucked_up_torus';
import { Identity } from '../fn/identity';
import Interval from '../fn/interval';
import Rotator from '../fn/rotator';
import Sphere from '../fn/sphere';
import Spiral from '../fn/spiral';
import Stereo from '../fn/stereo';
import Torus from '../fn/torus';
import { pp } from '../pp';

import {
  AccessNode,
  ArithNode,
  FnNode,
  PipeNode,
  Scalar,
  StepNode,
  Value,
} from './ast';
import { Link, Scope, UnaryOperator } from './types';

export type Resolution = {
  n: number;
  staticFn: CompositeFn;
  dynamicFn: CompositeFn;
};

export class Resolver {
  constructor(private readonly scope: Scope) {}

  resolve(node: PipeNode): Resolution;
  resolve(node: Scalar, hint: 'number'): number;
  resolve(node: Scalar, hint: 'function'): Function;
  resolve(node: Scalar): Value;
  resolve(node: any, hint?: any): any {
    switch (node.kind) {
      case 'pipe':
        return this.resolvePipe(node);
      case 'number':
        return node.value;
      case 'fn':
        return this.resolveFn(node);
      case 'access':
        return this.resolveAccess(node);
      case 'id':
        const value = this.resolveId(node.id);
        const actual = typeof value;
        if (hint)
          assert.equal(
            actual,
            hint,
            `Expected identifier ${node.id} to resolve to a ${hint}, but was ${actual} instead.`,
          );
        return value;
      case 'arith':
        return this.resolveArith(node);
    }
  }

  private resolvePipe = (pipe: PipeNode): Resolution => {
    const chain = pipe.chain;
    const links: Link[] = [];
    const fun = chain[0];
    const d = this.resolve(fun.args[0], 'number');
    const link = this.resolveFirstStep(d, fun);
    const n = Interval.n(link.fn.domain, pipe.n);

    links.push(link);

    for (let i = 1; i < chain.length; i++) {
      links.push(this.resolveStep(links[i - 1].fn, chain[i]));
    }

    const [staticFn, dynamicFn] = this.buildComposites(links);
    return { n, staticFn, dynamicFn };
  };

  private buildComposites = (links: Link[]) => {
    let builder = new CompositeFn.Builder();
    while (links.length && !links[0].isDynamic) {
      builder.add(links.shift().fn);
    }

    const init = builder.build();
    builder = new CompositeFn.Builder().add(new Identity(init.d));

    while (links.length) {
      builder.add(links.shift().fn);
    }

    const iter = builder.build();
    return [init, iter];
  };

  private resolveFirstStep = (d: number, { type, args }: StepNode) => {
    const fn = funs[type](d, ...args.map(a => this.resolve(a)));
    const isDynamic = args.some(this.isNodeDynamic);

    return { fn, isDynamic };
  };

  private resolveStep = (prev: Fn, { type, args }: StepNode): Link => {
    const d = ranges[type](prev.d);
    const fn = funs[type](d, ...args.map(a => this.resolve(a)));
    const isDynamic = args.some(this.isNodeDynamic);

    return { fn, isDynamic };
  };

  private resolveFn = ({ name, args }: FnNode): number => {
    const fn = Math[name];
    assert(
      typeof fn === 'function',
      `Expected ${name} to be a Math function in ${pp({ name, args })}`,
    );
    return fn(...args.map(a => this.resolve(a)));
  };

  private resolveAccess = ({ id, index }: AccessNode): number => {
    const scope = this.scope;
    const target = scope[id];
    assert(target, `Unable to resolve ${id} in scope ${pp(scope, 2)}`);
    return target[this.resolve(index, 'number')];
  };

  private resolveId = (id: string): Value => {
    if (id in this.scope) {
      return this.scope[id];
    } else if (id in Math) {
      return Math[id];
    } else {
      const idu = id.toUpperCase();
      if (idu in Math) return Math[idu];
    }

    assert.fail(`unable to resolve id ${id} in scope ${pp(this.scope, 2)}`);
  };

  private resolveArith = ({ op, operands }: ArithNode) => {
    const [a, b] = operands.map(a => this.resolve(a, 'number'));
    return ops[op](a, b);
  };

  private isNodeDynamic = (node: Scalar): boolean => {
    switch (node.kind) {
      case 'fn':
        return node.args.some(this.isNodeDynamic);
      case 'id':
        return typeof this.resolve(node) === 'number';
      case 'arith':
        return node.operands.some(this.isNodeDynamic);
      default:
        return false;
    }
  };
}

const ops: { [op: string]: (a: number, b: number) => number } = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '**': (a, b) => a ** b,
  '^': (a, b) => a ** b,
};

const rotate = (
  d: number,
  theta: number,
  d0: number,
  d1: number,
  f0: UnaryOperator = Math.cos,
  f1: UnaryOperator = Math.sin,
) => {
  return new Rotator(d, theta, d0, d1, f0, f1);
};

const funs: { [op: string]: (d: number, ...rest) => Fn } = {
  cube: (d, l) => new Cube(d, l),
  sphere: (d, r: number) => new Sphere(d, r),
  spiral: (d, a: number, k: number) =>
    new Spiral(d, new Array(d).fill(a), new Array(d - 1).fill(k)),
  torus: (d, r: number, t: number) => new Torus(d, r, t),
  fucked_up_torus: (d, r: number, t: number) => new FuckedUpTorus(d, r, t),
  rotate,
  r: rotate,
  stereo: (d, to) => new Stereo(d, to),
};

type Funs = typeof funs;

type Ranges = {
  [P in keyof Funs]: (domain: number) => number;
};

const ranges: Ranges = {
  cube: domain => domain,
  sphere: domain => domain + 1,
  spiral: domain => domain + 1,
  torus: domain => domain + 1,
  fucked_up_torus: domain => domain + 1,
  rotate: domain => domain,
  r: domain => domain,
  stereo: domain => domain,
};
