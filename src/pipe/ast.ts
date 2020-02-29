export function pipe(n: number, d0: number, steps: StepNode[]) {
  return { kind: 'pipe', n, d0, steps };
}

export type PipeNode = {
  kind: 'pipe';
  n: number;
  d0: number;
  steps: StepNode[];
};

export type StepType =
  | 'sphere'
  | 'spiral'
  | 'torus'
  | 'lattice'
  | 'cube'
  | 'rotate'
  | 'stereo'
  | 'quaternion';

export function step(type: StepType, args: Scalar[]): StepNode {
  return { kind: 'step', type, args };
}

export type StepNode = {
  kind: 'step';
  type: StepType;
  args: Scalar[];
};

export type Scalar =
  | ArithNode
  | NumberNode
  | FnNode
  | AccessNode
  | IdNode
  | ParenNode;

export function arith(op: ArithOp, a: Scalar, b: Scalar): ArithNode;
export function arith(op: ArithOp, a: Scalar): ArithNode;
export function arith(
  op: ArithOp,
  ...operands: [Scalar, Scalar] | [Scalar]
): ArithNode {
  return { kind: 'arith', op, operands };
}

export type ArithOp = '*' | '/' | '+' | '-' | '**' | '^';

export type ArithNode = {
  kind: 'arith';
  op: ArithOp;
  operands: [Scalar, Scalar] | [Scalar];
};

export function number(value: number): NumberNode {
  return { kind: 'number', value };
}

export type NumberNode = {
  kind: 'number';
  value: number;
};

export function fn(name: string, args: Scalar[]) {
  return { kind: 'fn', name: name.toLowerCase(), args };
}

export type FnNode = {
  kind: 'fn';
  name: string;
  args: Scalar[];
};

export function access(id: string, index: Scalar): AccessNode {
  return { kind: 'access', id, index };
}

// TODO Should separate indexing vs member access in the grammar, but too
// lazy right now... That said, maybe this is OK. too lazy to decide right
// now...
export type AccessNode = {
  kind: 'access';
  id: string;
  index: Scalar;
};

export function id(id: string): IdNode {
  return { kind: 'id', id };
}

export type IdNode = {
  kind: 'id';
  id: string;
};

export function paren(scalar: Scalar): ParenNode {
  return { kind: 'paren', scalar };
}

export type ParenNode = {
  kind: 'paren';
  scalar: Scalar;
};
