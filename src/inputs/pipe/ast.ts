const screenSize = Math.round(window.screen.width * window.screen.height);
import cm from 'codemirror';

export function findErrors(node: Node): ErrorNode[] {
  switch (node.kind) {
    case 'pipe':
      return node.statements.reduce(
        (errors, n) => errors.concat(findErrors(n)),
        []
      );
    case 'assignment':
      return findErrors(node.value);
    case 'step':
      return node.args.reduce((errors, n) => errors.concat(findErrors(n)), []);
    case 'arith':
      return node.operands.reduce(
        (errors, n) => errors.concat(findErrors(n)),
        []
      );
    case 'fn':
      return node.args.reduce((errors, n) => errors.concat(findErrors(n)), []);
    case 'property':
      return findErrors(node.receiver).concat(findErrors(node.name));
    case 'element':
      return findErrors(node.receiver).concat(findErrors(node.index));
    case 'paren':
      return findErrors(node.scalar);
    case 'id':
    case 'number':
      return [];
    case 'error':
    default:
      return [node];
  }
}

export function includes(node: Node, cursor: cm.Position): boolean {
  const zero = {line: 0, column: 0};
  const {start, end} = node.region ?? {start:zero, end: zero};
  const {line, ch} = cursor;
  if (start.line == line) {
    return start.column <= ch;
  } else if (start.line < line && line < end.line) {
    return true;
  } else if (line == end.line) {
    return ch < end.column;
  } else {
    return false;
  }
}

export type Node = PipeNode | Statement | Scalar | ErrorNode;

export function pipe(statements: Statement[], region?: Region): PipeNode {
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

  return new PipeNode(steps, variables, statements, region);
}

export type Statement = AssignmentNode | StepNode;

export class PipeNode {
  readonly kind = 'pipe';

  constructor(
    readonly steps: StepNode[],
    readonly variables: Variables,
    readonly statements: Statement[],
    readonly region?: Region
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

export function assignment(
  name: string,
  value: Scalar,
  region?: Region
): AssignmentNode {
  return new AssignmentNode(name, value, region);
}

export class AssignmentNode {
  readonly kind = 'assignment';

  constructor(
    readonly name: string,
    readonly value: Scalar,
    readonly region?: Region
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
  region?: Region
): StepNode {
  return new StepNode(type, args, region);
}

export class StepNode {
  readonly kind = 'step';

  constructor(
    readonly type: StepType,
    readonly args: Scalar[],
    readonly region?: Region
  ) {}

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
  | ElementNode
  | ErrorNode;

export function arith(
  op: ArithOp,
  operands: [Scalar, Scalar] | [Scalar],
  region?: Region
): ArithNode {
  return new ArithNode(op, operands, region);
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
    readonly region?: Region
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

export function number(value: number, region?: Region): NumberNode {
  return new NumberNode(value, region);
}

export class NumberNode {
  readonly kind = 'number';

  constructor(readonly value: number, readonly region?: Region) {}

  toString() {
    return this.value;
  }
}

export function fn(name: FnName, args: Scalar[], region?: Region): FnNode {
  return new FnNode(name, args, region);
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

  constructor(
    readonly name: FnName,
    readonly args: Scalar[],
    readonly region?: Region
  ) {}

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

export function id(id: string, region?: Region): IdNode {
  return new IdNode(id, region);
}

export class IdNode {
  readonly kind = 'id';

  constructor(readonly id: string, readonly region?: Region) {}

  toString() {
    return this.id;
  }
}

export function paren(scalar: Scalar, region?: Region): ParenNode {
  return new ParenNode(scalar, region);
}

export class ParenNode {
  readonly kind = 'paren';

  constructor(readonly scalar: Scalar, readonly region?: Region) {}

  toString() {
    return `(${this.scalar})`;
  }
}

export function property(
  receiver: IdNode | PropertyNode,
  name: IdNode,
  region?: Region
) {
  return new PropertyNode(receiver, name, region);
}

export class PropertyNode {
  readonly kind = 'property';

  constructor(
    readonly receiver: IdNode | PropertyNode,
    readonly name: IdNode,
    readonly region?: Region
  ) {}

  toString() {
    return `${this.receiver}.${this.name}`;
  }
}

export function element(
  receiver: IdNode | ElementNode,
  index: Scalar,
  region?: Region
) {
  return new ElementNode(receiver, index, region);
}

export class ElementNode {
  readonly kind = 'element';

  constructor(
    readonly receiver: IdNode | ElementNode,
    readonly index: Scalar,
    readonly region?: Region
  ) {}

  toString() {
    return `${this.receiver}[${this.index}]`;
  }
}

export function error(src: string, region?: Region): ErrorNode {
  return new ErrorNode(src, region);
}

export class ErrorNode {
  readonly kind = 'error';

  constructor(readonly src: string, readonly region?: Region) {}

  toString() {
    return `<error>(${this.src})`;
  }
}

export interface Region {
  start: Location;
  end: Location;
}

export interface Location {
  line: number;
  column: number;
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
