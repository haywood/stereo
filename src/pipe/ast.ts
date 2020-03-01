export function pipe(variables: Variables, steps: StepNode[]): PipeNode {
  return {
    kind: 'pipe',
    steps,
    variables
  };
}

export interface PipeNode {
  kind: 'pipe';
  steps: StepNode[];
  variables: Variables;
}

export interface Variables {
  n: NumberNode;
  d0: NumberNode;
}

export enum StepType {
  CUBE = 'cube',
  LATTICE = 'lattice',
  QUATERNION = 'Q',
  ROTATE = 'R',
  SPHERE = 'sphere',
  SPIRAL = 'spiral',
  STEREO = 'stereo',
  TORUS = 'torus'
}

export function step(type: StepType, args: Scalar[]): StepNode {
  return { kind: 'step', type, args };
}

export interface StepNode {
  kind: 'step';
  type: StepType;
  args: Scalar[];
}

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

export enum ArithOp {
  ADD = '+',
  DIV = '/',
  EXP = '**',
  EXP_CARET = '^',
  MUL = '*',
  SUB = '-'
}

export interface ArithNode {
  kind: 'arith';
  op: ArithOp;
  operands: [Scalar, Scalar] | [Scalar];
}

export function number(value: number): NumberNode {
  return { kind: 'number', value };
}

export interface NumberNode {
  kind: 'number';
  value: number;
}

export function fn(name: string, args: Scalar[]): FnNode {
  return { kind: 'fn', name: name.toLowerCase(), args };
}

export interface FnNode {
  kind: 'fn';
  name: string;
  args: Scalar[];
}

export function access(id: string, index: Scalar): AccessNode {
  return { kind: 'access', id, index };
}

// TODO Should separate indexing vs member access in the grammar, but too
// lazy right now... That said, maybe this is OK. too lazy to decide right
// now...
export interface AccessNode {
  kind: 'access';
  id: string;
  index: Scalar;
}

export function id(id: string): IdNode {
  return { kind: 'id', id };
}

export interface IdNode {
  kind: 'id';
  id: string;
}

export function paren(scalar: Scalar): ParenNode {
  return { kind: 'paren', scalar };
}

export interface ParenNode {
  kind: 'paren';
  scalar: Scalar;
}
