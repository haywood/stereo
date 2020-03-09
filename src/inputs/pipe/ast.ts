const screenSize = Math.round(window.screen.width * window.screen.height);

export function findErrors(node: Node): ErrorNode[] {
  switch (node.kind) {
    case 'pipe': return node.statements.reduce((errors, n) => errors.concat(findErrors(n)), []);
    case 'assignment': return findErrors(node.value);
    case 'step': return node.args.reduce((errors, n) => errors.concat(findErrors(n)), []);
    case 'arith': return node.operands.reduce((errors, n) => errors.concat(findErrors(n)), []);
    case 'fn': return node.args.reduce((errors, n) => errors.concat(findErrors(n)), []);
    case 'property': return findErrors(node.receiver).concat(findErrors(node.name));
    case 'element': return findErrors(node.receiver).concat(findErrors(node.index));
    case 'paren': return findErrors(node.scalar);
    case 'id':
    case 'number':
      return [];
    case 'error':
    default:
      return [node];
  }
}

export type Node = PipeNode|Statement|Scalar|ErrorNode;

export function pipe(statements: Statement[]): PipeNode {
  const variables = { n: number(screenSize), d0: number(4) };
  const steps = [];

  for (const node of statements) {
    if (node instanceof AssignmentNode) {
      variables[node.name] = node.value;
    } else if (node instanceof StepNode) {
      steps.push(node);
    }
  }

  steps[0]?.args.unshift(variables.d0);

  for (let i = 1; i < steps.length; i++) {
    const rangeFn = rangeFns[steps[i].type];
    const d0 = steps[i - 1].args[0] as NumberNode;
    steps[i].args.unshift(number(d0.value));
  }

  return new PipeNode(steps, variables, statements);
}

export type Statement = AssignmentNode | StepNode;

export class PipeNode {
  readonly kind = 'pipe';
  constructor(
    readonly steps: StepNode[],
    readonly variables: Variables,
    readonly statements: Statement[]
  ) {}

  toString() {
    return this.statements.join('\n');
  }
}

export interface Variables {
  n: NumberNode;
  d0: NumberNode;

  [name: string]: Scalar;
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

  toString() {
    return `${this.type}(${this.args.slice(1).join(', ')})`;
  }
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
  TAN = 'tan'
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
  readonly kind = 'error';

  constructor(readonly src: string) {}

  toString() {
    return `<error>(${this.src})`;
  }
}

type RangeFn = (domain: number) => number;

const rangeFns: Record<StepType, RangeFn> = {
  [StepType.CUBE]: domain => domain,
  [StepType.LATTICE]: domain => domain,
  [StepType.SPHERE]: domain => domain + 1,
  [StepType.SPIRAL]: domain => domain + 1,
  [StepType.TORUS]: domain => domain + 1,
  [StepType.ROTATE]: domain => domain,
  [StepType.STEREO]: domain => domain,
  [StepType.QUATERNION]: domain => domain
};
