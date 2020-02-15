import { CompositeFn, Fn } from '../fn';
import Cube from '../fn/cube';
import FuckedUpTorus from '../fn/fucked_up_torus';
import Lattice from '../fn/lattice';
import { Quaternion } from '../fn/quaternion';
import Rotator from '../fn/rotator';
import Sphere from '../fn/sphere';
import Spiral from '../fn/spiral';
import Stereo from '../fn/stereo';
import Torus from '../fn/torus';
import { Scope } from '../params/scope';
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
import { UnaryOperator } from './types';

type Resolution = {
  n: number;
  fn: CompositeFn;
};

function assert(cond: any, scope: Scope, msg: () => string) {
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
    const n = this.resolve(pipe.n, 'number');
    this.expect(n > 0, 'n', 'be positive', `was ${n}`);

    const fn = new CompositeFn.Builder().add(this.resolveStep(pipe.d0, head));

    for (let i = 0; i < tail.length; i++) {
      const step = tail[i];
      const d0 = fn.d;
      const d = ranges[step.type](d0);
      fn.add(this.resolveStep(d, step));
    }

    return { n, fn: fn.build() };
  };

  private resolveStep = (d: number, { type, args }: StepNode): Fn => {
    const fun = funs[type];
    this.expect(fun, type, 'be defined', 'was not');
    return fun(d, ...args.map(a => this.resolve(a)));
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

  private assert(cond: any, msg: () => string) {
    assert(cond, this.scope, msg);
  }

  private expect(cond: any, node: any, expected: string, actual: string) {
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

const funs: { [op: string]: (d: number, ...rest: any) => Fn } = {
  cube: (d, l) => new Cube(d, l),
  lattice: (d, l) => new Lattice(d, l),
  sphere: (d, r: number) => new Sphere(d, r),
  spiral: (d, theta: number, r: number) => new Spiral(d, theta, r),
  torus: (d, ...r: number[]) => new Torus(d, new Float32Array(r)),
  fucked_up_torus: (d, r: number, t: number) => new FuckedUpTorus(d, r, t),
  rotate: (
    d: number,
    theta: number,
    d0: number,
    d1: number,
    f0: UnaryOperator = Math.cos,
    f1: UnaryOperator = Math.sin
  ) => new Rotator(d, theta, d0, d1, f0, f1),
  stereo: (d, to) => new Stereo(d, to),
  q: (d, r: number, i: number, j: number, k: number) =>
    new Quaternion(d, r, i, j, k)
};

type Funs = typeof funs;

type Ranges = {
  [P in keyof Funs]: (domain: number) => number;
};

const ranges: Ranges = {
  cube: domain => domain,
  lattice: domain => domain,
  sphere: domain => domain + 1,
  spiral: domain => domain + 1,
  torus: domain => domain + 1,
  fucked_up_torus: domain => domain + 1,
  rotate: domain => domain,
  r: domain => domain,
  stereo: domain => domain,
  q: domain => domain
};
