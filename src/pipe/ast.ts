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

export function print(node: PipeNode): string;
export function print(node: StepNode): string;
export function print(node: Scalar): string;
export function print(node: any) {
  switch (node.kind) {
    case 'pipe':
      return printPipe(node);
    case 'step':
      return printStep(node);
    case 'arith':
      return printArith(node);
    case 'number':
      return printNumber(node);
    case 'fn':
      return printFn(node);
    case 'access':
      return printAccess(node);
    case 'id':
      return printId(node);
  }
}

function printPipe(node: PipeNode): string {
  return [node.n, node.d0, ...node.steps.map(print)].join('\n  =>');
}

function printStep(node: StepNode): string {
  return `${node.type}(${node.args.map(print).join(', ')})`;
}

function printArith(node: ArithNode): string {
  const [a, b] = node.operands;
  const expr =
    b == null ? `-${print(a)}` : `${print(a)} ${node.op} ${print(b)}`;
  return node.parens ? `(${expr})` : expr;
}

function printNumber(node: NumberNode): string {
  return node.value.toString();
}

function printFn(node: FnNode): string {
  return `${node.name}(${node.args.map(print).join(', ')})`;
}

function printAccess(node: AccessNode): string {
  return `${node.id}[${print(node.index)}]`;
}

function printId(node: IdNode): string {
  return node.id;
}
