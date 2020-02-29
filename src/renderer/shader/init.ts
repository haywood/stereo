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
} from '../../pipe/ast';
import { ensureFloat, resolveInt, from, uniforms, varyings } from './common';

export function init({ type, args }: StepNode): string {
  switch (type) {
    case 'sphere':
    case 'torus':
      return interval0To2Pi(args);
    case 'spiral':
      return spiral(args);
    case 'lattice':
      return lattice(args);
    case 'cube':
      return cube(args);
    default:
      throw new Error(`Can't initialize step type ${type}`);
  }
}

function interval0To2Pi(args: Scalar[]) {
  const d = resolveInt(args[0]) - 1;
  return interval(d, '0.', 'float(2. * pi)');
}

function spiral(args: Scalar[]): string {
  const d = resolveInt(args[0]) - 1;
  return interval(d, '0.', from(args[1]));
}

function lattice(args: Scalar[]): string {
  const d = resolveInt(args[0]);
  return interval(d, '0.', '1.');
}

function cube(args: Scalar[]): string {
  const [d, l] = args;
  return endent`{ // init cube
    const int d = ${resolveInt(d)};
    float l = ${ensureFloat(l)};

    float n_face = round(float(n) / float(d) / 2.);
    float branching_factor = round(pow(n_face, 1. / float(d)));

    for (int k = 0; k < d; k++) {
      float exp = float(d - k - 1);
      float dividend = round(float(i) / pow(branching_factor, exp));
      float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
      y[k] = l * (tmp - 0.5);
    }
  } // init cube
  `;
}

function interval(d: number, a: string, b: string): string {
  return endent`{ // init interval
    const int d = ${d};
    const float a = ${a};
    const float b = ${b};
    float branching_factor = round(pow(float(n), 1. / float(d)));

    for (int k = 0; k < d; k++) {
      float exp = float(d - k - 1);
      float dividend = round(float(i) / pow(branching_factor, exp));
      float tmp = mod(dividend, branching_factor) / (branching_factor - 1.);
      x[k] = a + tmp * (b - a);
    }
  } // init interval`;
}
