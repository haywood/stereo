import endent from 'endent';

import { Band } from '../../audio/band';
import {
  ArithNode,
  ArithOp,
  BuiltinConstant,
  AudioFnName,
  IdNode,
  FnNode,
  Scalar,
  BandName,
  Variables
} from '../../inputs/pipe/ast';
import * as ast from '../../inputs/pipe/ast';
import glsl from './glsl/common.glsl';

const { ADD, DIV, EXP, EXP_CARET, MUL, SUB } = ArithOp;
const BC = BuiltinConstant;

export const d0 = 'int(_d0)';
export const screenSize = Math.round(
  window.screen.width * window.screen.height
);
export const far = Math.hypot(window.screen.width, window.screen.height);
export const near = far / 100000;
export const fov = 100;

export const D_MAX = 10;

export const defines: { [name: string]: number } = {
  D_MAX,
  BAND_COUNT: Band.spectrum.length,
  near: near,
  [safeName(BC.E)]: Math.E,
  [safeName(BC.LN10)]: Math.LN10,
  [safeName(BC.LN2)]: Math.LN2,
  [safeName(BC.LOG10E)]: Math.LOG10E,
  [safeName(BC.LOG2E)]: Math.LOG2E,
  [safeName(BC.PI)]: Math.PI,
  [safeName(BC.SQRT1_2)]: Math.SQRT1_2,
  [safeName(BC.SQRT2)]: Math.SQRT2
};

export function header() {
  return glsl;
}

export function variables(variables: Variables) {
  return Object.entries(variables)
    .map(([name, value]) => `float ${safeName(name)} = ${ensureFloat(value)};`)
    .filter(s => !!s)
    .join('\n');
}

export function safeName(name: string) {
  return `_${name}`;
}

export function from(node: Scalar): string {
    if (node instanceof ast.ArithNode) {
      return fromArith(node);
    } else if (node instanceof ast.FnNode) {
      return fromFn(node);
    } else if (node instanceof ast.NumberNode) {
      return fromNumber(node.value);
    } else if (node instanceof ast.ParenNode) {
      return from(node.scalar);
    } else if (node instanceof ast.IdNode) {
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
  if (node instanceof ast.IdNode && node.id in defines) {
    const defined = defines[node.id];
    return typeof defined == 'number' && !Number.isInteger(defined);
  } else if (node instanceof ast.IdNode) {
    return true; // all user-specified variables are floats
  } else if (node instanceof ast.NumberNode) {
    return !Number.isInteger(node.value);
  } else if (node instanceof ast.FnNode) {
    return true; // so far no integer-valued fns
  } else if (node instanceof ast.ArithNode) {
    return node.operands.some(isFloat);
  } else if (node instanceof ast.ParenNode) {
    return isFloat(node.scalar);
  } else {
    return false;
  }
}

function fromArith(node: ArithNode): string {
  const { op, operands } = node;
  const [a, b] = operands.map(operands.some(isFloat) ? ensureFloat : from);

  const binary = (op: ast.ArithOp) => () => `${a} ${op} ${b}`;
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
  if (BandName.values.includes(id)) {
    return `audio.${id}`;
  } else {
    return safeName(id);
  }
}

function fromNumber(value: number): string {
  return value.toString();
}
