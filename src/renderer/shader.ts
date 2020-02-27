import endent from 'endent';

import { HSV } from '../params';
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
import { pp } from '../pp';
import hsv2rgb from './glsl/hsv2rgb.glsl';
import interval from './glsl/interval.glsl';
import lattice_01 from './glsl/lattice_01.glsl';
import rotate from './glsl/rotate.glsl';
import sphere from './glsl/sphere.glsl';
import stereo from './glsl/stereo.glsl';
import torus from './glsl/torus.glsl';

const vertexFunctions = [interval, lattice_01, rotate, sphere, stereo, torus];
const fragmentFunctions = [hsv2rgb];

const uniforms = `
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

const varyings = `
varying vec3 p;
`;

export const D_MAX = 10;

export class Shader {
  static vertex({ n, steps }: PipeNode): string {
    const last = steps[steps.length - 1];
    const d = last.type == 'stereo' ? last.args[1] : last.args[0];

    return endent`
    ${uniforms}

    ${varyings}

    ${vertexFunctions.join('\n')}

    void main() {
      float[D_MAX] x, y;

      ${init(steps[0])}

      ${steps.map(step).join('\nx = y;\n\n')}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -400. * near / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
  }

  static fragment(hsv: HSV): string {
    const ensureFloat = (x: Scalar) =>
      isFloat(x) ? from(x) : `float(${from(x)})`;
    const h = ensureFloat(hsv.h);
    const s = ensureFloat(hsv.s);
    const v = ensureFloat(hsv.v);

    return endent`
    ${uniforms}

    ${varyings}

    ${fragmentFunctions.join('\n')}

    void main() {
      float h = ${h} * 360.;
      float s = ${s};
      float v = ${v};

      gl_FragColor = vec4(hsv2rgb(h, s, v), 1.);
    }
    `;
  }
}

function init(node: StepNode): string {
  const initializers = {
    sphere({ args }: StepNode) {
      const d = from(minus(args[0], 1));
      return endent`
        x = interval(${d}, 0., float(2. * pi), lattice_01(${d}));
        `;
    },

    torus({ args }: StepNode) {
      const d = from(minus(args[0], 1));
      return endent`
        x = interval(${d}, 0., float(2. * pi), lattice_01(${d}));
        `;
    }
  };

  return initializers[node.type](node);
}

function step(node: StepNode): string {
  const steps = {
    sphere({ args }: StepNode) {
      const [d, r] = args.map(from);

      return endent`
      y = sphere(${d}, float(${r}), x);
      `;
    },

    torus({ args }: StepNode) {
      const [d, ...r] = args.map(from);
      return endent`
      y = torus(${d}, ${vector(r)}, x);
      `;
    },

    rotate({ args }: StepNode) {
      const [d, phi, d0, d1, f0, f1] = args.map(from);
      // TODO handle f0, f1
      return endent`
      y = rotate(${d}, ${phi}, ${d0}, ${d1}, x);
      `;
    },

    stereo({ args }: StepNode) {
      return endent`
      y = stereo(${args.map(from).join(', ')}, x);
      `;
    }
  };

  return steps[node.type](node);
}

function from(node: Scalar): string {
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
      throw new Error(
        `Can't handle node kind '${node.kind}' in node ${pp(node)}`
      );
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

function minus(x: Scalar, y: number): Scalar {
  return { kind: 'arith', op: '-', operands: [x, numberNode(y)] };
}

function numberNode(value: number): NumberNode {
  return { kind: 'number', value };
}

function vector(xs: Scalar[]): string {
  const padding = new Array(D_MAX - xs.length).fill('0.').join(', ');
  return endent`
  float[](${xs.map(x => `float(${x})`).join(', ')}, ${padding})
  `;
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

function isFloat(node: Scalar): boolean {
  switch (node.kind) {
    case 'id':
      return node.id == 't';
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
