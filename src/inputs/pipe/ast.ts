import * as cm from 'codemirror';

export type Node = PipeNode | Statement | Scalar | ErrorNode;

export type Statement = AssignmentNode | StepNode | ErrorNode;

export class PipeNode {
  readonly variables: Variables;
  readonly kind = 'pipe';

  constructor(
    readonly assignments: AssignmentNode[],
    readonly steps: StepNode[],
    readonly colors: ColorNode[],
    readonly errors: ErrorNode[],
    readonly location?: Location
  ) {
    this.variables = {};

    for (const node of assignments) {
      this.variables[node.name.id] = node.value;
    }
  }

  toString() {
    return this.statements.join('\n');
  }

  get statements() {
    return [...this.assignments, ...this.steps, ...this.colors, ...this.errors];
  }
}

export type Variables = Record<string, Scalar>;

export function assignment(
  name: IdNode,
  value: Scalar,
  location?: Location
): AssignmentNode {
  return new AssignmentNode(name, value, location);
}

export class AssignmentNode {
  readonly kind = 'assignment';

  constructor(
    readonly name: IdNode,
    readonly value: Scalar,
    readonly location?: Location
  ) {}

  toString() {
    return `${this.name} = ${this.value}`;
  }
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

export function step(
  type: StepType,
  args: Scalar[],
  location?: Location
): StepNode {
  return new StepNode(type, args, location);
}

export class StepNode {
  readonly kind = 'step';

  constructor(
    readonly type: StepType,
    readonly args: Scalar[],
    readonly location?: Location
  ) {}

  toString() {
    return `${this.type}(${this.args.join(', ')})`;
  }
}

export namespace StepNode {
  export enum Type {
    CUBE = 'cube',
    LATTICE = 'lattice',
    QUATERNION = 'Q',
    ROTATE = 'R',
    SPHERE = 'sphere',
    SPIRAL = 'spiral',
    STEREO = 'stereo',
    TORUS = 'torus'
  }

  export const types = Object.values(Type);
}

export class ColorNode {
  readonly kind = 'color';

  constructor(
    readonly mode: ColorNode.Mode,
    readonly args: Scalar[],
    readonly location?: Location
  ) {}

  toString() {
    return `${this.mode}(${this.args.join(', ')})`;
  }
}

export namespace ColorNode {
  export enum Mode {
    HSV = 'hsv'
  }

  export const modes = Object.values(Mode);
}

export type Scalar =
  | ArithNode
  | NumberNode
  | FnNode
  | IdNode
  | ParenNode
  | ErrorNode;

export function arith(
  op: ArithOp,
  operands: [Scalar, Scalar] | [Scalar],
  location?: Location
): ArithNode {
  return new ArithNode(op, operands, location);
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
    readonly operands: [Scalar, Scalar] | [Scalar],
    readonly location?: Location
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

export function number(value: number, location?: Location): NumberNode {
  return new NumberNode(value, location);
}

export class NumberNode {
  readonly kind = 'number';

  constructor(readonly value: number, readonly location?: Location) {}

  toString() {
    return this.value;
  }
}

export function fn(name: FnName, args: Scalar[], location?: Location): FnNode {
  return new FnNode(name, args, location);
}

export enum FnName {
  ABS = 'abs',
  AMIX = 'amix',
  ARC_COS = 'acos',
  ARC_SIN = 'asin',
  ARC_TAN = 'atan',
  CEIL = 'ceil',
  CLAMP = 'clamp',
  COS = 'cos',
  DEGREES = 'degrees',
  EXP = 'exp',
  EXPM1 = 'expm1',
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
  P1 = 'p1',
  RADIANS = 'radians',
  SIGN = 'sign',
  SIN = 'sin',
  SMOOTH_STEP = 'smoothstep',
  SQRT = 'sqrt',
  STEP = 'step',
  TAN = 'tan'
}

export class FnNode {
  readonly kind = 'fn';

  constructor(
    readonly name: FnName,
    readonly args: Scalar[],
    readonly location?: Location
  ) {}

  toString() {
    return `${this.name}(${this.args.join(', ')})`;
  }
}

export enum BuiltinConstant {
  E = 'e',
  I = 'i',
  LN10 = 'ln10',
  LN2 = 'ln2',
  LOG10E = 'log10e',
  LOG2E = 'log2e',
  P = 'p',
  PI = 'pi',
  SQRT1_2 = 'sqrt1_2',
  SQRT2 = 'sqrt2',
  TIME = 't'
}

export namespace BuiltinConstant {
  export const values = Object.values(BuiltinConstant);
}

export enum BuiltinVariable {
  D0 = 'd0',
  N = 'n'
}

export enum BandName {
  LOW = 'low',
  MID = 'mid',
  HIGH = 'high',
  FULL = 'full'
}

export namespace BandName {
  export const values = Object.values(BandName);
}

export function id(id: string, location?: Location): IdNode {
  return new IdNode(id, location);
}

export class IdNode {
  readonly kind = 'id';

  constructor(readonly id: string, readonly location?: Location) {}

  toString() {
    return this.id;
  }
}

export function paren(scalar: Scalar, location?: Location): ParenNode {
  return new ParenNode(scalar, location);
}

export class ParenNode {
  readonly kind = 'paren';

  constructor(readonly scalar: Scalar, readonly location?: Location) {}

  toString() {
    return `(${this.scalar})`;
  }
}

export function error(
  message: string,
  src: string,
  location?: Location
): ErrorNode {
  return new ErrorNode(message, src, location);
}

export class ErrorNode {
  readonly kind = 'error';

  constructor(
    readonly message: string,
    readonly src: string,
    readonly location?: Location
  ) {}

  toString() {
    return `<error>(${this.message})`;
  }
}

export interface Location {
  start: cm.Position;
  end: cm.Position;
}

export const constants = [...BuiltinConstant.values, ...BandName.values];

export const alwaysDefinedIds = new Set<string>([
  ...constants,
  ...Object.values(FnName),
  ...Object.values(StepType)
]);
