import endent from 'endent';

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
  const interval0To2Pi = () => {
    const d = from(minus(args[0], 1));
    return endent`
    x = interval(${d}, 0., float(2. * pi), lattice_01(${d}));
    `;
  };

  switch (type) {
    case 'sphere':
    case 'torus':
      return interval0To2Pi();
    case 'spiral':
      const d = from(minus(args[0], 1));
      return endent`
      x = interval(${d}, 0., ${from(args[1])}, lattice_01(${d}));
      `;
    default:
      throw new Error(`Can't initialize step type ${type}`);
  }
}

function minus(x: Scalar, y: number): Scalar {
  return { kind: 'arith', op: '-', operands: [x, numberNode(y)] };
}

function numberNode(value: number): NumberNode {
  return { kind: 'number', value };
}
