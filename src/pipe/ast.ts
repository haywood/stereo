import { AccessNode, NumberNode, Scalar, IdNode } from '*.pegjs';

export function numberNode(value: number): NumberNode {
  return { kind: 'number', value };
}

export function access(id: string, index: Scalar): AccessNode {
  return { kind: 'access', id, index };
}

export function minus(x: Scalar, y: number): Scalar {
  return { kind: 'arith', op: '-', operands: [x, numberNode(y)] };
}

export function plus(x: Scalar, y: number): Scalar {
  return { kind: 'arith', op: '+', operands: [x, numberNode(y)] };
}

export function id(id: string): IdNode {
  return { kind: 'id', id };
}
