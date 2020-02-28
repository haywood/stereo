import { NumberNode } from '*.pegjs';

export function numberNode(value: number): NumberNode {
  return { kind: 'number', value };
}
