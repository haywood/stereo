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
  StepType
} from '../../pipe/ast';
import { ensureFloat, resolveInt, from, uniforms, varyings } from './common';
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

export function init({ type, args }: StepNode): string {
  switch (type) {
    case SPHERE:
    case TORUS:
      return interval_0_2pi(args);
    case SPIRAL:
      return spiral(args);
    case LATTICE:
      return interval_0_1(args);
    case CUBE:
      return cube(args);
    default:
      return lattice_1(args);
  }
}

function interval_0_2pi(args: Scalar[]) {
  const d = resolveInt(args[0]) - 1;
  return interval(d, '0.', '2. * pi');
}

function spiral(args: Scalar[]): string {
  const d = resolveInt(args[0]) - 1;
  return interval(d, '0.', from(args[1]));
}

function interval_0_1(args: Scalar[]): string {
  const d = resolveInt(args[0]);
  return interval(d, '0.', '1.');
}

function lattice_1(args: Scalar[]): string {
  const d = resolveInt(args[0]);
  return interval(d, '-0.5', '0.5');
}

function interval(d: number, a: string, b: string): string {
  return endent`{ // init interval
    const int d = ${d};
    const float a = ${a};
    const float b = ${b};
    float branching_factor = round(pow(n, 1. / float(d)));

    for (int k = 0; k < d; k++) {
      float exp = float(d - k - 1);
      float dividend = round(i / pow(branching_factor, exp));
      float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
      x[k] = a + tmp * (b - a);
    }
  } // init interval`;
}

function cube(args: Scalar[]): string {
  const [d, l] = args;
  return endent`{ // init cube
    const int d = ${resolveInt(d)};
    float l = ${ensureFloat(l)};

    float n_face = round(n / float(d) / 2.);
    float branching_factor = round(pow(n_face, 1. / float(d)));

    for (int k = 0; k < d; k++) {
      float exp = float(d - k - 1);
      float dividend = round(i / pow(branching_factor, exp));
      float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
      y[k] = l * (tmp - 0.5);
    }
  } // init cube
  `;
}
