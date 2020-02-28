import endent from 'endent';

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
uniform float t;

uniform int n;

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
`;

export const D_MAX = 10;

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
    case 'id':
      return ['t', 'pi'].includes(node.id);
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
  // TODO Should separate indexing vs member access in the grammar, but too
  // lazy right now... That said, maybe this is OK. too lazy to decide right
  // now...
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
  const builtins = {
    pi: 'pi'
  };

  return builtins[id] ?? id;
}

function fromNumber(value: number): string {
  return value.toString();
}

function isNumber(node: Scalar): boolean {
  switch (node.kind) {
    case 'id':
      return node.id == 't';
    case 'number':
    case 'fn': // so far no all fns return floats
    case 'arith':
      return true;
    default:
      return false;
  }
}
