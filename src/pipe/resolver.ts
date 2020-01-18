import { CompositeFn, Fn } from '../fn';
import Cube from '../fn/cube';
import FuckedUpTorus from '../fn/fucked_up_torus';
import { Identity } from '../fn/identity';
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
  Value
} from './grammar.pegjs';
import { Scope } from './scope';
import { Link, UnaryOperator } from './types';

type Resolution = {
  n: number;
  staticFn: CompositeFn;
  dynamicFn: CompositeFn;
};

function assert(cond: boolean, scope: Scope, msg: () => string) {
  if (!cond) throw { message: msg(), scope };
}

export class Resolver {
  constructor(private readonly scope: Scope) {}

  resolve(node: PipeNode): Resolution;
  resolve(node: Scalar, hint: 'number'): number;
  resolve(node: Scalar, hint: 'function'): Function;
  resolve(node: Scalar): Value;
  resolve(node: any, hint?: any): any {
    let value;
    switch (node.kind) {
      case 'pipe':
        value = this.resolvePipe(node);
        break;
      case 'arith':
        value = this.resolveArith(node);
        break;
      case 'number':
        value = node.value;
        break;
      case 'fn':
        value = this.resolveFn(node);
        break;
      case 'access':
        value = this.resolveAccess(node);
        break;
      case 'id':
        value = this.resolveId(node.id);
        break;
      case 'paren':
        value = this.resolve(node.scalar);
        break;
    }

    if (hint) {
      const actual = typeof value;
      this.expect(actual === hint, node, `be a ${hint}`, `was ${actual}`);
    }

    if (hint === 'number') {
      this.expect(!isNaN(value), node, 'be a number', 'was NaN');
    }

    return value;
  }

  private resolvePipe = (pipe: PipeNode): Resolution => {
    const [head, ...tail] = pipe.steps;
    const links: Link[] = [];
    const link = this.resolveStep(pipe.d0, head);

    links.push(link);

    for (let i = 0; i < tail.length; i++) {
      links.push(this.resolveStep(links[i].fn.d, tail[i]));
    }

    const [staticFn, dynamicFn] = this.buildComposites(links);
    return { n: pipe.n, staticFn, dynamicFn };
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

  private resolveStep = (d0: number, { type, args }: StepNode): Link => {
    const d = ranges[type](d0);
    const fn = funs[type](d, ...args.map(a => this.resolve(a)));
    const isDynamic = args.some(this.isNodeDynamic);

    return { fn, isDynamic };
  };

  private resolveFn = ({ name, args }: FnNode): number => {
    const fn = Math[name];
    const type = typeof fn;
    this.expect(
      type === 'function',
      name,
      `resolve to a function`,
      `was ${type}`
    );
    return fn(...args.map(a => this.resolve(a)));
  };

  private resolveAccess = ({ id, index }: AccessNode): number => {
    const scope = this.scope;
    const target = scope[id];
    this.assert(target, () => `failed to resolve access target ${id}`);
    if (index.kind === 'id' && index.id in target) {
      // TODO works in practice, but not sure if corret
      return target[index.id];
    } else {
      return target[this.resolve(index)];
    }
  };

  private resolveId = (id: string): Value => {
    let value;
    if (id in this.scope) {
      value = this.scope[id];
    } else if (id in Math) {
      value = Math[id];
    } else {
      const idu = id.toUpperCase();
      if (idu in Math) value = Math[idu];
    }

    this.assert(value, () => `failed to resolve id ${id}`);

    return value;
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

  private assert(cond: boolean, msg: () => string) {
    assert(cond, this.scope, msg);
  }

  private expect(cond: boolean, node: any, expected: string, actual: string) {
    this.assert(
      cond,
      () => `Expected ${pp(node, 0)} to ${expected}, but ${actual}`
    );
  }
}

const ops: { [op: string]: (a: number, b: number) => number } = {
  '+': (a, b) => a + b,
  '-': (a, b) => (b == null ? -a : a - b),
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '**': (a, b) => a ** b,
  '^': (a, b) => a ** b
};

const funs: { [op: string]: (d: number, ...rest) => Fn } = {
  cube: (d, l) => new Cube(d, l),
  sphere: (d, r: number) => new Sphere(d, r),
  spiral: (d, a: number, k: number) =>
    new Spiral(d, new Array(d).fill(a), new Array(d - 1).fill(k)),
  torus: (d, r: number, t: number) => new Torus(d, r, t),
  fucked_up_torus: (d, r: number, t: number) => new FuckedUpTorus(d, r, t),
  rotate: (
    d: number,
    theta: number,
    d0: number,
    d1: number,
    f0: UnaryOperator = Math.cos,
    f1: UnaryOperator = Math.sin
  ) => {
    assert(
      0 <= d0 && d0 < d,
      null,
      () => `rotate: Expected 0 <= d0 = ${d0} < d = ${d}`
    );
    assert(
      0 <= d1 && d1 < d,
      null,
      () => `rotate: Expected 0 <= d1 = ${d1} < d = ${d}`
    );
    return new Rotator(d, theta, d0, d1, f0, f1);
  },
  stereo: (d, to) => new Stereo(d, to)
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
  stereo: domain => domain
};
