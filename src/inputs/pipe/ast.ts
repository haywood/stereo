import * as cm from 'codemirror';

export function findErrors(node: Node): ErrorNode[] {
  if (node instanceof PipeNode) {
    return [
      ...node.assignments.map(findErrors).flat(),
      ...node.steps.map(findErrors).flat(),
      ...node.errors
    ];
  } else if (node instanceof AssignmentNode) {
    return [...findErrors(node.name), ...findErrors(node.value)];
  } else if (node instanceof StepNode) {
    return node.args.map(findErrors).flat();
  } else if (node instanceof ArithNode) {
    return node.operands.map(findErrors).flat();
  } else if (node instanceof FnNode) {
    return node.args.map(findErrors).flat();
  } else if (node instanceof ParenNode) {
    return findErrors(node.scalar);
  } else if (node instanceof IdNode || node instanceof NumberNode) {
    return [];
  } else {
    return [node];
  }
}

export type Node = PipeNode | Statement | Scalar | ErrorNode;

export function pipe(
  assignments: AssignmentNode[],
  steps: StepNode[],
  errors: ErrorNode[],
  location?: Location
): PipeNode {
  return new PipeNode(assignments, steps, errors, location);
}

export type Statement = AssignmentNode | StepNode | ErrorNode;

export class PipeNode {
  readonly variables: Variables;
  readonly kind = 'pipe';

  constructor(
    readonly assignments: AssignmentNode[],
    readonly steps: StepNode[],
    readonly errors: ErrorNode[],
    readonly location?: Location
  ) {
    this.variables = { };

    for (const node of assignments) {
      this.variables[node.name.id] = node.value;
    }
  }

  toString() {
    return [...this.assignments, ...this.steps].join('\n');
  }

  get statements() {
    return [...this.errors, ...this.steps, ...this.assignments];
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
    return `${this.type}(${this.args.slice(1).join(', ')})`;
  }
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
  POWER = 'power',
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
  EPSILON = 'epsilon',
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

export enum BuiltinVariable {
  D0 = 'd0',
  N = 'n'
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

export function error(src: string, location?: Location): ErrorNode {
  return new ErrorNode(src, location);
}

export class ErrorNode {
  readonly kind = 'error';

  constructor(readonly message: string, readonly location?: Location) {}

  toString() {
    return `<error>(${this.message})`;
  }
}

export interface Location {
  start: cm.Position;
  end: cm.Position;
}

export const alwaysDefinedIds = new Set<string>([
  ...Object.values(BuiltinConstant),
  ...Object.values(FnName),
  ...Object.values(StepType),
]);
