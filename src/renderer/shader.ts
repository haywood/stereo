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
import interval from './glsl/interval.glsl';
import lattice_01 from './glsl/lattice_01.glsl';
import rotate from './glsl/rotate.glsl';
import sphere from './glsl/sphere.glsl';
import stereo from './glsl/stereo.glsl';
import torus from './glsl/torus.glsl';

const functionDefs = [interval, lattice_01, rotate, sphere, stereo, torus];
const uniforms = `
uniform float t;

uniform int n;

uniform struct Audio {
  float power;
} audio;
`;

export const D_MAX = 10;

export class Shader {
  static vertex({ n, steps }: PipeNode): string {
    const last = steps[steps.length - 1];
    const d = last.type == 'stereo' ? last.args[1] : last.args[0];

    return endent`
    ${uniforms}

    ${functionDefs.join('\n')}

    vec4 to_position(int d, float[D_MAX] y) {
      vec4 p;

      for (int k = 0; k < min(d, 4); k++) {
        p[k] = y[k];
      }

      if (d < 4) {
        p[3] = 1.;
      }

      return p;
    }

    void main() {
      float[D_MAX] x, y;

      ${Shader.init(steps[0])}

      ${steps.map(Shader.step).join('\nx = y;\n\n')}

      vec4 mvPosition = modelViewMatrix * to_position(${Shader.from(d)}, y);
      gl_PointSize = -400. * near / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }`;
  }

  static fragment({ h, s, v }: HSV): string {
    return endent`
    ${uniforms}

    void main() {
      gl_FragColor = vec4(1.);
    }
    `;
  }

  private static init(node: StepNode): string {
    return Shader.initializers[node.type](node);
  }

  private static step(node: StepNode): string {
    return Shader.steps[node.type](node);
  }

  private static initializers = {
    sphere({ args }: StepNode) {
      const d = Shader.from(minus(args[0], 1));
      return endent`
      x = interval(${d}, 0., float(2. * pi), lattice_01(${d}));
      `;
    },

    torus({ args }: StepNode) {
      const d = Shader.from(minus(args[0], 1));
      return endent`
      x = interval(${d}, 0., float(2. * pi), lattice_01(${d}));
      `;
    }
  };

  private static steps = {
    sphere({ args }: StepNode) {
      const [d, r] = args.map(Shader.from);

      return endent`
      y = sphere(${d}, float(${r}), x);
      `;
    },

    torus({ args }: StepNode) {
      const [d, ...r] = args.map(Shader.from);
      return endent`
      y = torus(${d}, ${vector(r)}, x);
      `;
    },

    rotate({ args }: StepNode) {
      const [d, phi, d0, d1, f0, f1] = args.map(Shader.from);
      // TODO handle f0, f1
      return endent`
      y = rotate(${d}, ${phi}, ${d0}, ${d1}, x);
      `;
    },

    stereo({ args }: StepNode) {
      const [from, to] = args.map(Shader.from);
      return endent`
      y = stereo(${from}, ${to}, x);
      `;
    }
  };

  private static from(node: Scalar): string {
    switch (node.kind) {
      case 'access':
        return Shader.fromAccess(node);
      case 'arith':
        return Shader.fromArith(node);
      case 'number':
        return Shader.fromNumber(node.value);
      case 'paren':
        return Shader.from(node.scalar);
      case 'id':
        return Shader.fromId(node.id);
      default:
        throw new Error(
          `Can't handle node kind '${node.kind}' in node ${pp(node)}`
        );
    }
  }

  private static fromAccess({ id, index }: AccessNode): string {
    // TODO this is wrong; want to split access into index and member
    return `${Shader.fromId(id)}.${Shader.from(index)}`;
  }

  private static fromArith(node: ArithNode): string {
    const { op, operands } = node;
    const [a, b] = operands.map(Shader.from);
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

  private static fromId(id: string): string {
    const builtins = {
      pi: 'pi'
    };

    return builtins[id] ?? id;
  }

  private static fromNumber(value: number): string {
    return value.toString();
  }
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
