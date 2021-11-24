import * as cm from 'codemirror';

export interface Location {
  start: cm.Position;
  end: cm.Position;
}

export interface Node {
  readonly children: Node[];
  readonly location: Location;
}

export interface Statement extends Node {}

export interface Scalar extends Node {}

export class PipeNode implements Node {
  readonly variables: Variables;

  constructor(
    readonly assignments: AssignmentNode[],
    readonly steps: StepNode[],
    readonly colors: ColorNode[],
    readonly errors: ErrorNode[],
    readonly location: Location
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

  get children(): Node[] {
    return this.statements;
  }
}

export type Variables = Record<string, Scalar>;

export function assignment(
  name: IdNode,
  value: Scalar,
  location: Location
): AssignmentNode {
  return new AssignmentNode(name, value, location);
}

export class AssignmentNode implements Statement {
  constructor(
    readonly name: IdNode,
    readonly value: Scalar,
    readonly location: Location
  ) {}

  toString() {
    return `${this.name} = ${this.value}`;
  }

  get children() {
    return [this.name, this.value];
  }
}

export class StepNode implements Statement {
  constructor(
    readonly type: IdNode,
    readonly args: Scalar[],
    readonly location: Location
  ) {}

  toString() {
    return `${this.type}(${this.args.join(', ')})`;
  }

  get children() {
    return [this.type, ...this.args];
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

export class ColorNode implements Statement {
  constructor(
    readonly mode: IdNode,
    readonly args: Scalar[],
    readonly location: Location
  ) {}

  toString() {
    return `${this.mode}(${this.args.join(', ')})`;
  }

  get children() {
    return this.args.slice();
  }
}

export namespace ColorNode {
  export enum Mode {
    RGB = 'rgb',
    HSV = 'hsv',
  }

  export const modes = Object.values(Mode);
}

export function arith(
  op: ArithOp,
  operands: [Scalar, Scalar] | [Scalar],
  location: Location
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

export class ArithNode implements Scalar {
  constructor(
    readonly op: ArithOp,
    readonly operands: [Scalar, Scalar] | [Scalar],
    readonly location: Location
  ) {}

  toString() {
    const [a, b] = this.operands;
    if (b == null) {
      return `${this.op} ${a}`;
    } else {
      return `${a} ${this.op} ${b}`;
    }
  }

  get children() {
    return this.operands.slice();
  }
}

export function number(value: number, location: Location): NumberNode {
  return new NumberNode(value, location);
}

export class NumberNode implements Scalar {
  readonly children = [];

  constructor(readonly value: number, readonly location: Location) {}

  toString() {
    return this.value.toString();
  }
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

export class FnNode implements Scalar {
  constructor(
    readonly name: IdNode,
    readonly args: Scalar[],
    readonly location: Location
  ) {}

  toString() {
    return `${this.name}(${this.args.join(', ')})`;
  }

  get children() {
    return [this.name, ...this.args];
  }
}

export namespace FnNode {
  export const names = Object.values(FnName);
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

export function id(id: string, location: Location): IdNode {
  return new IdNode(id, location);
}

export class IdNode implements Scalar {
  readonly children = [];

  constructor(readonly id: string, readonly location: Location) {}

  toString() {
    return this.id;
  }
}

export function paren(scalar: Scalar, location: Location): ParenNode {
  return new ParenNode(scalar, location);
}

export class ParenNode implements Scalar {
  constructor(readonly scalar: Scalar, readonly location: Location) {}

  toString() {
    return `(${this.scalar})`;
  }

  get children() {
    return [this.scalar];
  }
}

export function error(
  message: string,
  src: string,
  location: Location
): ErrorNode {
  return new ErrorNode(message, src, location);
}

export class ErrorNode implements Node {
  readonly children = [];

  constructor(
    readonly message: string,
    readonly src: string,
    readonly location: Location
  ) {}

  toString() {
    return `<error>(${this.message})`;
  }
}

export const constants = [...BuiltinConstant.values, ...BandName.values];

export const alwaysDefinedIds = new Set<string>([
  ...constants,
  ...Object.values(FnName),
  ...StepNode.types,
  ...ColorNode.modes
]);
