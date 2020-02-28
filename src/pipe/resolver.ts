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

function assert(cond: any, scope: Scope, msg: () => string) {
  if (!cond) throw { message: msg(), scope };
}

export class Resolver {
  constructor(private readonly scope: Scope) {}

  resolve(node: any): number {
    let value;
    switch (node.kind) {
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

    const actual = typeof value;
    this.expect(actual == 'number', node, `be a number`, `was ${actual}`);
    this.expect(!isNaN(value), node, 'be a number', 'was NaN');

    return value;
  }

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
    const [a, b] = operands.map(a => this.resolve(a));
    return ops[op](a, b);
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
