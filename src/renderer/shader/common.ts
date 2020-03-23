import endent from 'endent';

import {
  ArithNode,
  ArithOp,
  FnNode,
  Scalar,
  Variables
} from '../../inputs/pipe/ast';
import glsl from './glsl/common.glsl';

const { ADD, DIV, EXP, EXP_CARET, MUL, SUB } = ArithOp;

export const d0 = 'int(d0)';
export const screenSize = Math.round(
  window.screen.width * window.screen.height
);
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

export function header() {
  return glsl;
}

export function variables(variables: Variables) {
  return Object.entries(variables)
    .map(([name, value]) => `float ${safe(name)} = ${ensureFloat(value)};`)
    .filter(s => !!s)
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
  }
}

export function ensureFloat(node: Scalar) {
  if (isFloat(node)) {
    return from(node);
  } else {
    return `float(${from(node)})`;
  }
}

export function ensureInt(node: Scalar) {
  if (isFloat(node)) {
    return `int(${from(node)})`;
  } else {
    return from(node);
  }
}

export function isFloat(node: Scalar): boolean {
  switch (node.kind) {
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
    return safe(id);
  }
}

function fromNumber(value: number): string {
  return value.toString();
}

function safe(name: string) {
  const converted = new Set(['i', 'n']);
  if (converted.has(name)) {
    return `_${name}`;
  } else {
    return name;
  }
}
