import endent from 'endent';

import {
  ArithNode,
  ArithOp,
  ElementNode,
  FnNode,
  IdNode,
  NumberNode,
  PipeNode,
  PropertyNode,
  Scalar,
  StepNode,
  Variables
} from '../../inputs/pipe/ast';
import { pp } from '../../pp';

const { ADD, DIV, EXP, EXP_CARET, MUL, SUB } = ArithOp;

const uniforms = `
uniform float t;
uniform struct Audio {
  float hue;
  int onset;
  float pitch;
  float power;
  float tempo;
} audio;
`;

const varyings = endent`
varying vec3 p;
varying float i;
`;

export const far = Math.hypot(window.screen.width, window.screen.height);
export const near = far / 100000;
export const fov = 100;

export const D_MAX = 10;

export const defines: { [name: string]: number } = {
  D_MAX,
  // array indices for quaternion multiplication
  Q_R: 0,
  Q_I: 1,
  Q_J: 2,
  Q_K: 3,
  near: near,
  e: Math.E,
  ln10: Math.LN10,
  ln2: Math.LN2,
  log10e: Math.LOG10E,
  log2e: Math.LOG2E,
  pi: Math.PI,
  sqrt1_2: Math.SQRT1_2,
  sqrt2: Math.SQRT2
};

export function header(vs: Variables) {
  return endent`
  ${uniforms}

  ${varyings}

  ${variables(vs)}
  `;
}

function variables(vs: Variables) {
  return Object.entries(vs)
    .map(([name, value]) => {
      return `float ${name} = ${ensureFloat(value)};`;
    })
    .join('\n');
}

export function from(node: Scalar): string {
  switch (node.kind) {
    case 'arith':
      return fromArith(node);
    case 'fn':
      return fromFn(node);
    case 'number':
      return fromNumber(node.value);
    case 'paren':
      return from(node.scalar);
    case 'id':
      return fromId(node.id);
    case 'property':
      return fromProperty(node);
    case 'element':
      return fromElement(node);
  }
}

export function ensureFloat(node: Scalar) {
  if (isFloat(node)) {
    return from(node);
  } else {
    return `float(${from(node)})`;
  }
}

export function isFloat(node: Scalar): boolean {
  switch (node.kind) {
    case 'element':
      return true; // I don't think there are any int arrays
    case 'property':
      // TODO currently works, but is pretty awkward and brittle
      return fromProperty(node) != 'audio.onset';
    case 'id':
      if (node.id in defines) {
        const defined = defines[node.id];
        return typeof defined == 'number' && !Number.isInteger(defined);
      }
      return true; // all user-specified variables are floats
    case 'number':
      return !Number.isInteger(node.value);
    case 'fn':
      return true; // so far no integer-valued fns
    case 'arith':
      return node.operands.some(isFloat);
    case 'paren':
      return isFloat(node.scalar);
    default:
      return false;
  }
}

function fromArith(node: ArithNode): string {
  const { op, operands } = node;
  const [a, b] = operands.map(operands.some(isFloat) ? ensureFloat : from);

  const binary = op => () => `${a} ${op} ${b}`;
  const exp = () => `pow(${a}, ${b})`;

  const ops: Record<ArithOp, () => string> = {
    [ADD]: binary(ADD),
    [DIV]: binary(DIV),
    [EXP]: exp,
    [EXP_CARET]: exp,
    [MUL]: binary(MUL),
    [SUB]: binary(SUB)
  };

  return ops[op]();
}

function fromFn(node: FnNode): string {
  const args = node.args.map(ensureFloat);
  return endent`
  ${node.name}(${args.join(', ')})
  `;
}

function fromId(id: string): string {
  if (id in defines) {
    return defines[id].toString();
  } else {
    return id;
  }
}

function fromProperty({ receiver, name }: PropertyNode) {
  if (receiver instanceof PropertyNode) {
    return `${fromProperty(receiver)}.${name.id}`;
  } else {
    return `${receiver.id}.${name.id}`;
  }
}

function fromElement({ receiver, index }: ElementNode) {
  if (receiver instanceof ElementNode) {
    return `${fromElement(receiver)}.${resolve(index)}`;
  } else {
    return `${receiver.id}[${resolve(index)}]`;
  }
}

function fromNumber(value: number): string {
  return value.toString();
}

function isNumber(node: Scalar): boolean {
  switch (node.kind) {
    case 'id':
      return node.id == 't';
    case 'number':
    case 'fn': // so far all fns return floats
    case 'arith':
      return true;
    default:
      return false;
  }
}

export function resolveInt(node: Scalar): number {
  const value = resolve(node);
  if (Number.isInteger(value)) {
    return value;
  } else {
    throw new Error(
      `expected an integer, but node resolved to ${value}:\n${pp(node)}`
    );
  }
}

function resolve(node: Scalar): number {
  let value;
  switch (node.kind) {
    case 'arith':
      value = resolveArith(node);
      break;
    case 'number':
      value = node.value;
      break;
    case 'id':
      value = resolveId(node.id);
      break;
    case 'paren':
      value = resolve(node.scalar);
      break;
    case 'property':
    case 'fn':
      throw new Error(
        `can't statically resolve node kind '${node.kind}' to a number`
      );
      break;
  }

  if (typeof value != 'number') {
    throw new Error(endent`expected a number, but node resolved to ${value}:
      ${pp(node)}`);
  }

  return value;
}

function resolveArith(node: ArithNode): number {
  const { op, operands } = node;
  const [a, b] = operands.map(resolve);

  const ops: Record<ArithOp, () => number> = {
    [ADD]: () => a + b,
    [DIV]: () => a / b,
    [EXP]: () => a ** b,
    [EXP_CARET]: () => a ** b,
    [MUL]: () => a * b,
    [SUB]: () => b ?? a - b ?? -a
  };

  return ops[op]();
}

function resolveId(id: string): number {
  if (id in defines) {
    return defines[id];
  } else {
    throw new Error(`don't know how to resolve non-builtin ${id} to a number`);
  }
}
