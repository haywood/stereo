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
import { pp } from '../pp';
import interval from './glsl/interval.glsl';
import lattice_01 from './glsl/lattice_01.glsl';
import rotate from './glsl/rotate.glsl';
import sphere from './glsl/sphere.glsl';
import stereo from './glsl/stereo.glsl';

const functionDefs = [interval, lattice_01, rotate, sphere, stereo];

export class Shader {
  static vertex({ n, steps }: PipeNode): string {
    const last = steps[steps.length - 1];
    const d = last.type == 'stereo' ? last.args[1] : last.args[0];

    return endent`
    uniform struct Audio {
      float power;
    };

    uniform struct Scope {
      float t;
      Audio audio;
    } scope;

    const int n = ${Shader.from(n)};

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

  private static init(node: StepNode): string {
    return Shader.initializers[node.type](node);
  }

  private static step(node: StepNode): string {
    return Shader.steps[node.type](node);
  }

  private static initializers = {
    sphere({ args }: StepNode) {
      const d = (args[0] as NumberNode).value - 1;
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
        return Shader.fromId(node);
      default:
        throw new Error(
          `Can't handle node kind '${node.kind}' in node ${pp(node)}`
        );
    }
  }

  private static fromAccess({ id, index }: AccessNode): string {
    // TODO this is wrong; want to split access into index and member
    return `scope.${id}.${index.id}`;
  }

  private static fromArith(node: ArithNode): string {
    const { op, operands } = node;
    const [a, b] = operands.map(Shader.from);

    switch (op) {
      case '+':
      case '*':
      case '/':
        return `float(${a}) ${op} float(${b})`;
      case '**':
      case '^':
        return `pow(float(${a}), float(${b}))`;
      case '-':
        return b == null ? `-float(${a})` : `float(${a}) - float(${b})`;
      default:
        throw node;
    }
  }

  private static fromId({ id }: IdNode): string {
    const builtins = {
      pi: 'pi'
    };

    return builtins[id] ?? `scope.${id}`;
  }

  private static fromNumber(value: number): string {
    return value.toString();
  }
}
