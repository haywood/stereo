import endent from 'endent';

import {
  ArithNode,
  FnName,
  ArithOp,
  FnNode,
  IdNode,
  NumberNode,
  PipeNode,
  Scalar,
  StepNode,
  StepType,
  arith,
  element,
  fn,
  id,
  number
} from '../../inputs/pipe/ast';
import {
  D_MAX,
  ensureFloat,
  from,
  resolveInt,
} from './common';

const {
  CUBE,
  LATTICE,
  QUATERNION,
  ROTATE,
  SPHERE,
  SPIRAL,
  STEREO,
  TORUS
} = StepType;
const { MUL } = ArithOp;

export function iter({ type, args }: StepNode): string {
  type StepFn = (args: Scalar[]) => string;

  const fns: Record<StepType, StepFn> = {
    [TORUS]: torus,
    [SPIRAL]: spiral,
    [SPHERE]: sphere,
    [LATTICE]: lattice,
    [CUBE]: cube,
    [ROTATE]: rotate,
    [STEREO]: stereo,
    [QUATERNION]: quaternion
  };

  return fns[type](args);
}

function torus(args: Scalar[]) {
  const d = args[0];
  const r0 = args[1];
  let r;

  if (args.length == 2) {
    r = new Array(resolveInt(d)).fill(r0);
  } else {
    r = args.slice(2).map(ensureFloat);
  }

  const stanzas = r.map((rk, k) => {
    return endent`
    x[0] += ${rk};
    ${rotate([d, element(id('tmp'), number(k + 1)), number(k), number(k + 2)])}
    copy(y, x);
    `;
  });

  return endent`{ // torus(${args.join(', ')})
    ${sphere([number(2), r0])}

    float tmp[D_MAX];
    copy(x, tmp);
    copy(y, x);

    ${stanzas.join('\n\n')}

    copy(x, y);
  } // torus`;
}

function spiral([d, _, r]: Scalar[]) {
  const body = polar2cart(resolveInt(d), arith(MUL, [r, fn(FnName.NORM2, [id('x')])]));

  return endent`{ // spiral(${d}, ${r})
    ${body}
  } // spiral`;
}

function sphere([d, r]: Scalar[]) {
  return endent`{ // sphere(${d}, ${r})
    ${polar2cart(resolveInt(d), r)}
  } // sphere`;
}

function lattice(args: Scalar[]) {
  const d = resolveInt(args[0]);
  const l = ensureFloat(args[1]);

  return endent`{ // lattice(${args.join(', ')})
    const int d = ${d};
    float l = ${l};

    for (int k = 0; k < d; k++) {
      y[k] = l * (x[k] - 0.5);
    }
  } // lattice`;
}

function cube([d, l]: Scalar[]) {
  return endent`{ // cube(${d}, ${l})
    const int d = ${resolveInt(d)};
    float l = ${ensureFloat(l)};
    float sign = i <= n / 2. ? 1. : -1.;
    float value = sign * l / 2.;

    int axis = int(mod(i / float(d) / 2., float(d)));
    for (int k = 0; k < D_MAX; k++) {
      if (k == axis) {
        y[k] = value;
        break;
      }
    }
  } // cube`;
}

function rotate([d, phi, d0, d1]: Scalar[]) {
  return endent`{ // rotate(${d}, ${phi}, ${d0}, ${d1})
    const int d = ${resolveInt(d)}, d0 = ${resolveInt(d0)}, d1 = ${resolveInt(
    d1
  )};
    float phi = ${ensureFloat(phi)};

    float r0 = cos(phi), r1 = sin(phi), x0 = x[d0], x1 = x[d1];

    x[d0] = x0 * r0 - x1 * r1;
    x[d1] = x0 * r1 + x1 * r0;

    copy(x, y);
  } // rotate`;
}

function stereo(args: Scalar[]) {
  let from = resolveInt(args[0]);
  const to = resolveInt(args[1]);

  return _stereo(from, to, '');
}

function _stereo(from: number, to: number, pre: string) {
  if (from == to) {
    return endent`
    ${pre}

    // stereo(${from}, ${to})
    copy(x, y);
    `;
  } else if (from-- > to) {
    return _stereo(from, to, endent`
    ${pre}

    // stereo(${from}, ${to})
    for (int k = 0; k < ${from}; k++) {
      y[k] = x[k + 1] / (1. - x[0]);
    }
    copy(y, x);
    `);
  } else if (from < to) {
    return _stereo(from, to, endent`{ // stereo(${from}, ${to})
      ${pre}

      float n2 = norm2(x);
      float divisor = n2 + 1.;
      x[0] = (n2 - 1.) / divisor;

      for (int k = 0; k < ${from}; k++) {
        y[k] = 2. * x[k - 1] / divisor;
      }

      copy(y, x);
    }
    `);
  }
}

function quaternion(args: Scalar[]) {
  let r, i, j, k;
  if (args.length == 2) {
    r = i = j = k = args[1];
  } else {
    [r, i, j, k] = args.slice(1);
  }

  return endent`{ // quaternion(${args.join(', ')})
    float r = ${ensureFloat(r)};
    float i = ${ensureFloat(i)};
    float j = ${ensureFloat(j)};
    float k = ${ensureFloat(k)};

    zero(y);

    // y += x * r
    y[Q_R] += x[Q_R] * r; // r * r = r
    y[Q_I] += x[Q_I] * r; // i * r = i
    y[Q_J] += x[Q_J] * r; // j * r = j
    y[Q_K] += x[Q_K] * r; // k * r = k

    // y += x * i
    y[Q_R] += -x[Q_I] * i; // i * i = -1
    y[Q_I] += x[Q_R] * i; // r * i = i
    y[Q_J] += x[Q_K] * i; // k * i = j
    y[Q_K] += -x[Q_J] * i; // j * i = -k

    // y += x *j
    y[Q_R] += -x[Q_J] * j; // j * j = -1
    y[Q_I] += -x[Q_K] * j; // k * j = -i
    y[Q_J] += x[Q_R] * j; // r * j = j
    y[Q_K] += x[Q_I] * j; // i * j = k
    
    // y += x * k
    y[Q_R] += -x[Q_K] * k; // k * k = -1
    y[Q_I] += x[Q_J] * k; // j * k = i
    y[Q_J] += -x[Q_I] * k; // i * k = -j
    y[Q_K] += x[Q_R] * k; // r * k = k
  } // quaternion`;
}

function polar2cart(d: number, r: Scalar) {
  return endent`{ // polar2cart(${d}, ${r})
    const int d = ${d};

    y[0] = ${ensureFloat(r)};
    for (int k = 1; k < d; k++) {
      y[k] = y[0] * sin(x[k - 1]);
      y[0] *= cos(x[k - 1]);
    }
  }`;
}
