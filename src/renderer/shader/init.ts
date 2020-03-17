import endent from 'endent';

import {
  ArithNode,
  FnNode,
  IdNode,
  NumberNode,
  PipeNode,
  Scalar,
  StepNode,
  StepType
} from '../../inputs/pipe/ast';
import { ensureFloat, from, resolveInt } from './common';

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
  type StepFn = (args: Scalar[]) => string;

  const fns: Partial<Record<StepType, StepFn>> = {
    [SPHERE]: interval_0_2pi,
    [TORUS]: interval_0_2pi,
    [SPIRAL]: spiral,
    [LATTICE]: interval_0_1,
    [CUBE]: cube
  };

  return (fns[type] ?? lattice_1)(args);
}

function interval_0_2pi(args: Scalar[]) {
  const d = resolveInt(args[0]) - 1;
  return interval(d, '0.', '2. * pi');
}

function spiral([d, tau]: Scalar[]): string {
  return interval(resolveInt(d) - 1, '0.', ensureFloat(tau));
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
  return endent`{ // interval(${d}, ${a}, ${b})
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
  return endent`{ // init cube(${args.join(', ')})
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
