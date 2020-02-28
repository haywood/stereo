import {
  AccessNode,
  ArithNode,
  FnNode,
  IdNode,
  NumberNode,
  PipeNode,
  Scalar,
  StepNode
} from '*.pegjs';

export type Value = number | Function;

export function numberNode(value: number): NumberNode {
  return { kind: 'number', value };
}
