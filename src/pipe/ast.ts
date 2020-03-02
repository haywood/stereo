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

export function fn(name: FnName, args: Scalar[]): FnNode {
  return { kind: 'fn', name, args };
}

export enum FnName {
  COS = 'cos',
  SIN = 'sin',
  TAN = 'tan',
  RADIANS = 'radians',
  DEGREES = 'degrees',
  ARC_SIN = 'asin',
  ARC_COS = 'acos',
  ARC_TAN = 'atan',
  EXP = 'exp',
  LOG = 'log',
  LOG2 = 'log2',
  SQRT = 'sqrt',
  ABS = 'abs',
  SIGN = 'sign',
  FLOOR = 'floor',
  CEIL = 'ceil',
  FRACT = 'fract',
  MOD = 'mod',
  MIN = 'min',
  MAX = 'max',
  CLAMP = 'clamp',
  MIX = 'mix',
  STEP = 'step',
  SMOOTH_STEP = 'smoothstep'
}

export interface FnNode {
  kind: 'fn';
  name: FnName;
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

export enum BuiltinConstant {
  AUDIO = 'audio',
  E = 'e',
  I = 'i',
  LN10 = 'ln10',
  LN2 = 'ln2',
  LOG10E = 'log10e',
  LOG2e = 'log2e',
  P = 'p',
  PI = 'pi',
  SQRT1_2 = 'sqrt1_2',
  SQRT2 = 'sqrt2',
  TIME = 't'
}

export enum BuiltinVariable {
  D0 = 'd0',
  N = 'n'
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
