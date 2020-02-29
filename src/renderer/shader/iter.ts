import endent from 'endent';

import { id, numberNode, access, minus, plus } from '../../pipe/ast';
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
} from '../../pipe/grammar.pegjs';
import {
  ensureFloat,
  resolveInt,
  D_MAX,
  from,
  uniforms,
  varyings
} from './common';

export function iter(node: StepNode): string {
  switch (node.type) {
    case 'torus':
      return torus(node);
    case 'spiral':
      return spiral(node);
    case 'sphere':
      return sphere(node.args[0], node.args[1]);
    case 'lattice':
      return lattice(node);
    case 'cube':
      return cube(node.args[0], node.args[1]);
    case 'rotate':
      return rotate(node.args[0], node.args[1], node.args[2], node.args[3]);
    case 'stereo':
      return stereo(node);
    case 'quaternion':
      return quaternion(node);
  }
}

function torus(node: StepNode) {
  const d = node.args[0];
  const r0 = node.args[1];
  const r = node.args.slice(2).map(ensureFloat);

  const stanzas = r.map((rk, k) => {
    return endent`
    x[0] += ${rk};
    ${rotate(
      d,
      access('tmp', numberNode(k + 1)),
      numberNode(k),
      numberNode(k + 2)
    )}
    copy(y, x);
    `;
  });

  return endent`{ // torus
    const int d = ${resolveInt(d)};

    ${sphere(numberNode(2), r0)}

    float tmp[D_MAX];
    copy(x, tmp);
    copy(y, x);

    ${stanzas.join('\n\n')}

    copy(x, y);
  } // torus`;
}

function spiral({ args: [d, r] }: StepNode) {
  const body = polar2cart(resolveInt(d), {
    kind: 'arith',
    op: '*',
    operands: [
      r,
      {
        kind: 'fn',
        name: 'norm',
        args: [{ kind: 'id', id: 'x' }]
      }
    ]
  });

  return endent`{ // spiral
    ${body}
  } // spiral`;
}

function sphere(d: Scalar, r: Scalar) {
  return endent`{ // sphere 
    ${polar2cart(resolveInt(d), r)}
  } // sphere`;
}

function lattice({ args }: StepNode) {
  const d = resolveInt(args[0]);
  const l = ensureFloat(args[1]);

  return endent`{ // lattice
    const int d = ${d};
    float l = ${l};

    for (int k = 0; k < d; k++) {
      y[k] = l * (x[k] - 0.5);
    }
  } // lattice`;
}

function cube(d: Scalar, l: Scalar) {
  return endent`{ // cube
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

function rotate(d: Scalar, phi: Scalar, d0: Scalar, d1: Scalar) {
  return endent`{ // rotate
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

function stereo({ args }: StepNode) {
  const from = resolveInt(args[0]);
  const to = resolveInt(args[1]);
  let stanzas = [];
  let d0 = from;

  if (d0 == to) {
    stanzas.push('copy(x, y);');
  }

  while (d0 > to) {
    stanzas.push(endent`
    for (int k = 0; k < ${--d0}; k++) {
      y[k] = x[k + 1] / (1. - x[0]);
    }
    copy(y, x);
    `);
  }

  while (d0 < to) {
    stanzas.push(endent`
    float n2 = 0.;
    for (int k = 0; k < ${d0}; k++) {
      n2 += x[k] * x[k];
    }
    float divisor = n2 + 1.;
    x[0] = (n2 - 1.) / divisor;
    for (int k = 0; k < ${++d0}; k++) {
      y[k] = 2. * x[k - 1] / divisor;
    }
    copy(y, x);
    `);
  }

  return endent`{ // stereo ${from} => ${to}
    ${stanzas.join('\n')}
  } // stereo`;
}

function quaternion({ args }: StepNode) {
  const [_, r, i, j, k] = args;
  return endent`{ // quaternion
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
  return endent`{ // polar2cart
    const int d = ${d};

    y[0] = ${ensureFloat(r)};
    for (int k = 1; k < d; k++) {
      y[k] = y[0] * sin(x[k - 1]);
      y[0] *= cos(x[k - 1]);
    }
  }`;
}
