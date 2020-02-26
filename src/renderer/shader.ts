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

export class Shader {
  static vertex({ n, steps }: PipeNode): string {
    return endent`
    uniform struct Scope {
      float t;
    } scope;
    const int n = ${Shader.from(n)};

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
      float x0, x1, r0, r1;
      int d, d0;

      ${Shader.init(steps[0])}

      ${steps.map(Shader.step).join('\nx = y;\n\n')}

      vec4 mvPosition = modelViewMatrix * to_position(d, y);
      gl_PointSize = -400. * NEAR / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }`;
  }

  private static init(node: StepNode): string {
    return endent`
    // init
    ${Shader.initializers[node.type](node)}
    `;
  }

  private static step(node: StepNode): string {
    return endent`
    ${Shader.steps[node.type](node)}
    `;
  }

  private static initializers = {
    torus({ args }: StepNode) {
      const d = (args[0] as NumberNode).value - 1;
      return endent`
      ${Shader.lattice_01(d)}

      ${Shader.interval(
        d,
        new Array(d).fill(0),
        new Array(d).fill(2 * Math.PI)
      )}
      `;
    },

    sphere({ args }: StepNode) {
      const d = (args[0] as NumberNode).value - 1;
      return endent`
      ${Shader.lattice_01(d)}

      ${Shader.interval(
        d,
        new Array(d).fill(0),
        new Array(d).fill(2 * Math.PI)
      )}
      `;
    }
  };

  private static steps = {
    sphere(node: StepNode) {
      const {
        args: [d, r]
      } = node;

      return Shader.sphere(d, r);
    },

    torus(node: StepNode) {
      return '';
    },

    rotate({ args }: StepNode) {
      const [d, phi, d0, d1, f0, f1] = args.map(Shader.from);
      return endent`
      // rotate
      r0 = ${f0 || 'cos'}(float(${phi}));
      r1 = ${f1 || 'sin'}(float(${phi}));
      x0 = x[${d0}];
      x1 = x[${d1}];

      y = x;
      y[${d0}] = x0 * r0 - x1 * r1;
      y[${d1}] = x0 * r1 + x1 * r0;
      `;
    },

    stereo({ args }: StepNode) {
      const [from, to] = args.map(Shader.from);
      return endent`
      // stereo
      d0 = ${from};
      d = ${to};
      if (d0 == d) y = x;

      while (d0 > d) {
        for (int k = 0; k < d0 - 1; k++) {
          y[k] = x[k + 1] / (1. - x[0]);
        }
        d0--;
      }

      while (d0 < d) {
        float n2 = 0.;
        for (int k = 0; k < d0; k++) {
          n2 += x[k] * x[k];
        }
        float divisor = n2 + 1.;
        x[0] = (n2 - 1.) / divisor;
        for (int k = 0; k <= d0; k++) {
          y[k] = 2. * x[k - 1] / divisor;
        }
        d0++;
      }
      `;
    }
  };

  private static lattice_01(d: number) {
    return endent`
    // lattice_01
    d = ${d};
    float branching_factor = round(pow(float(n), 1. / float(d)));

    for (int k = 0; k < d; k++) {
      float exp = float(d - k - 1);
      float dividend = round(position[0] / pow(branching_factor, exp));
      x[k] = float(int(dividend) % int(branching_factor)) / (branching_factor - 1.);
    }
    `;
  }

  private static interval(d: number, a: number[], b: number[]) {
    const arr = (xs: number[]) => {
      const str = xs.map(x => `float(${Shader.fromNumber(x)})`).join(', ');
      const padding = new Array(10 - xs.length).fill('0.').join(', ');
      return `float[](${str}, ${padding})`;
    };

    return endent`
    // interval
    d = ${d};

    float[D_MAX] a = ${arr(a)};
    float[D_MAX] b = ${arr(b)};

    for (int k = 0; k < d; k++) {
      y[k] = a[k] + x[k] * (b[k] - a[k]);
    }
    x = y;
    `;
  }

  private static sphere(d: Scalar, r: Scalar) {
    return endent`
    // sphere
    y[0] = float(${Shader.from(r)});
    d = ${Shader.from(d)};
    for (int k = 1; k < d; k++) {
      y[k] = y[0] * sin(x[k - 1]);
      y[0] *= cos(x[k - 1]);
    }
    `;
  }

  private static from(node: Scalar): string {
    switch (node.kind) {
      case 'arith':
        return Shader.fromArith(node);
      case 'number':
        return Shader.fromNumber(node.value);
      case 'id':
        return Shader.fromId(node);
      default:
        return '';
    }
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
    return `scope.${id}`;
  }

  private static fromNumber(value: number): string {
    return value.toString();
  }
}
