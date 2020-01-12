export type PipeNode = {
  kind: 'pipe';
  n: number;
  d0: number;
  steps: StepNode[];
};

export type StepNode = {
  kind: 'step';
  type: string;
  args: Scalar[];
};

export type Scalar = ArithNode | NumberNode | FnNode | AccessNode | IdNode;

export type ArithNode = {
  kind: 'arith';
  op: string;
  operands: [Scalar, Scalar];
};

export type NumberNode = {
  kind: 'number';
  value: number;
};

export type FnNode = {
  kind: 'fn';
  name: string;
  args: Scalar[];
};

export type AccessNode = {
  kind: 'access';
  id: string;
  index: Scalar;
};

export type IdNode = {
  kind: 'id';
  id: string;
};

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
  return `${print(a)} ${node.op} ${print(b)}`;
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
