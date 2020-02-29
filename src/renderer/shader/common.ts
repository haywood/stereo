import endent from 'endent';

import { pp } from '../../pp';
import {
  AccessNode,
  ArithNode,
  FnNode,
  IdNode,
  NumberNode,
  PipeNode,
  Scalar,
  StepNode,
  Value
} from '../pipe/grammar.pegjs';

export const uniforms = `
uniform float n;
uniform float t;
uniform struct Audio {
  float hue;
  int onset;
  float pitch;
  float power;
  float tempo;
} audio;
`;

export const varyings = `
varying vec3 p;
varying float i;
`;

export const screenDiag = Math.hypot(window.screen.width, window.screen.height);
export const near = Math.max(screenDiag / 100_000, 0.01);
export const far = screenDiag;
export const fov = 100;

export const D_MAX = 10;

export const defines: { [name: string]: number } = {
  D_MAX,
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

export function from(node: Scalar): string {
  switch (node.kind) {
    case 'access':
      return fromAccess(node);
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
    default:
      throw new Error(`Can't generate GLSL source from node kind ${node.kind}`);
  }
}

export function isFloat(node: Scalar): boolean {
  switch (node.kind) {
    case 'access':
      // TODO currently works, but is pretty awkward and brittle
      return 'audio' == node.id && from(node.index) != 'onset';
    case 'id':
      if ('t' == node.id) return true;

      const define = defines[node.id];
      return typeof define == 'number' && !Number.isInteger(define);
    case 'number':
      return !Number.isInteger(node.value);
    case 'fn':
      return true; // so far no integer-valued fns
    case 'arith':
      return node.operands.some(isFloat);
    default:
      return false;
  }
}

function fromAccess({ id, index }: AccessNode): string {
  if (isNumber(index)) {
    return `${fromId(id)}[${from(index)}]`;
  } else {
    return `${fromId(id)}.${from(index)}`;
  }
}

function fromArith(node: ArithNode): string {
  const { op, operands } = node;
  const [a, b] = operands.map(from);
  const float = operands.some(isFloat) ? x => `float(${x})` : x => x;

  switch (op) {
    case '+':
    case '*':
    case '/':
      return `${float(a)} ${op} ${float(b)}`;
    case '**':
    case '^':
      return `pow(${float(a)}, ${float(b)})`;
    case '-':
      return b == null ? `-${float(a)}` : `${float(a)} - ${float(b)}`;
    default:
      throw node;
  }
}

function fromFn(node: FnNode): string {
  return endent`
    ${node.name}(${node.args.map(from).join('\n')})
    `;
}

function fromId(id: string): string {
  if (id in defines) {
    return defines[id].toString();
  } else {
    return id;
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

function resolveInt(node: Scalar): number {
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
    case 'access':
      value = resolveAccess(node);
      break;
    case 'id':
      value = resolveId(node.id);
      break;
    case 'paren':
      value = resolve(node.scalar);
      break;
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

  switch (op) {
    case '+':
      return a + b;
    case '*':
      return a * b;
    case '/':
      return a / b;
    case '**':
    case '^':
      return a ** b;
    case '-':
      return b == null ? -a : a - b;
    default:
      throw new Error(
        `don't know how to resolve arithmetic expression with operator ${op}`
      );
  }
}

function resolveId(id: string): number {
  if (id in defines) {
    return defines[id];
  } else {
    throw new Error(`don't know how to resolve non-builtin ${id} to a number`);
  }
}

function resolveAccess({ id, index }: AccessNode): number {
  const receiver = resolveId(id);
  let key;

  switch (index.kind) {
    case 'id':
      key = index.id;
      break;
    default:
      key = resolve(index); // assume index is a number
      break;
  }

  return receiver[key];
}
