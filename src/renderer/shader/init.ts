import endent from 'endent';

import { numberNode } from '../../pipe/ast';
import {
  AccessNode,
  ArithNode,
  FnNode,
  IdNode,
  NumberNode,
  PipeNode,
  Scalar,
  StepNode,
  Value
} from '../../pipe/grammar.pegjs';
import { from, uniforms, varyings } from './common';

export function init({ type, args }: StepNode): string {
  switch (type) {
    case 'sphere':
    case 'torus':
      return interval0To2Pi(args);
    case 'spiral':
      const d = from(minus(args[0], 1));
      return endent`
      x = interval(${d}, 0., ${from(args[1])});
      `;
    default:
      throw new Error(`Can't initialize step type ${type}`);
  }
}

function interval0To2Pi(args: Scalar[]) {
  const d = from(minus(args[0], 1));
  return endent`
  x = interval(${d}, 0., float(2. * pi));
  `;
}

function minus(x: Scalar, y: number): Scalar {
  return { kind: 'arith', op: '-', operands: [x, numberNode(y)] };
}
