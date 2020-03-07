export function pipe(variables: Variables, steps: StepNode[]): PipeNode {
  return { kind: 'pipe', steps, variables };
}

export interface PipeNode {
  kind: 'pipe';
  steps: StepNode[];
  variables: Variables;
}

export interface Variables {
  n: NumberNode;
  d0: NumberNode;

  [name: string]: Scalar;
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
  return new StepNode(type, args);
}

export class StepNode {
  readonly kind = 'step';

  constructor(readonly type: StepType, readonly args: Scalar[]) {}
}

export type Scalar =
  | ArithNode
  | NumberNode
  | FnNode
  | PropertyNode
  | IdNode
  | ParenNode
  | ElementNode;

export function arith(op: ArithOp, a: Scalar, b: Scalar): ArithNode;
export function arith(op: ArithOp, a: Scalar): ArithNode;
export function arith(
  op: ArithOp,
  ...operands: [Scalar, Scalar] | [Scalar]
): ArithNode {
  return new ArithNode(op, operands);
}

export enum ArithOp {
  ADD = '+',
  DIV = '/',
  EXP = '**',
  EXP_CARET = '^',
  MUL = '*',
  SUB = '-'
}

export class ArithNode {
  readonly kind = 'arith';

  constructor(
    readonly op: ArithOp,
    readonly operands: [Scalar, Scalar] | [Scalar]
  ) {}

  toString() {
    const [a, b] = this.operands;
    if (b == null) {
      return `${this.op} ${a}`;
    } else {
      return `${a} ${this.op} ${b}`;
    }
  }
}

export function number(value: number): NumberNode {
  return new NumberNode(value);
}

export class NumberNode {
  readonly kind = 'number';

  constructor(readonly value: number) {}

  toString() {
    return this.value;
  }
}

export function fn(name: FnName, args: Scalar[]): FnNode {
  return new FnNode(name, args);
}

export enum FnName {
  ABS = 'abs',
  ARC_COS = 'acos',
  ARC_SIN = 'asin',
  ARC_TAN = 'atan',
  CEIL = 'ceil',
  CLAMP = 'clamp',
  COS = 'cos',
  DEGREES = 'degrees',
  EXP = 'exp',
  FLOOR = 'floor',
  FRACT = 'fract',
  LOG = 'log',
  LOG2 = 'log2',
  MAX = 'max',
  MIN = 'min',
  MIX = 'mix',
  MOD = 'mod',
  NORM = 'norm',
  NORM2 = 'norm2',
  RADIANS = 'radians',
  SIGN = 'sign',
  SIN = 'sin',
  SMOOTH_STEP = 'smoothstep',
  SQRT = 'sqrt',
  STEP = 'step',
  TAN = 'tan',
}

export class FnNode {
  readonly kind = 'fn';

  constructor(readonly name: FnName, readonly args: Scalar[]) {}

  toString() {
    return `${this.name}(${this.args.join(', ')})`;
  }
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
  return new IdNode(id);
}

export class IdNode {
  readonly kind = 'id';

  constructor(readonly id: string) {}

  toString() {
    return this.id;
  }
}

export function paren(scalar: Scalar): ParenNode {
  return { kind: 'paren', scalar };
}

export class ParenNode {
  readonly kind = 'paren';

  constructor(readonly scalar: Scalar) {}

  toString() {
    return `(${this.scalar})`;
  }
}

export function assignment(name: string, value: Scalar): AssignmentNode {
  return new AssignmentNode(name, value);
}

export class AssignmentNode {
  readonly kind = 'assignment';

  constructor(readonly name: string, readonly value: Scalar) {}

  toString() {
    return `${this.name} = ${this.value}`;
  }
}

export function property(receiver: IdNode | PropertyNode, name: IdNode) {
  return new PropertyNode(receiver, name);
}

export class PropertyNode {
  readonly kind = 'property';

  constructor(
    readonly receiver: IdNode | PropertyNode,
    readonly name: IdNode
  ) {}

  toString() {
    return `${this.receiver}.${this.name}`;
  }
}

export function element(receiver: IdNode | ElementNode, index: Scalar) {
  return new ElementNode(receiver, index);
}

export class ElementNode {
  readonly kind = 'element';

  constructor(
    readonly receiver: IdNode | ElementNode,
    readonly index: Scalar
  ) {}

  toString() {
    return `${this.receiver}[${this.index}]`;
  }
}

export function error(src: string): ErrorNode {
  return new ErrorNode(src);
}

export class ErrorNode {
  constructor(readonly src: string) {}

  toString() {
    return `<error>(${this.src})`;
  }
}
