import {
  Scalar,
  StepNode,
  StepType
} from '../../inputs/pipe/ast';
import { d0, ensureFloat } from './common';

const {
  CUBE,
  LATTICE,
  SPHERE,
  SPIRAL,
  TORUS
} = StepType;

const d0m1 = 'int(d0) - 1';
export function init({ type, args }: StepNode, i: string): {y: string, d: string} {
  type StepFn = (i: string, args: Scalar[]) => {y: string, d: string};

  const fns: Partial<Record<StepType, StepFn>> = {
    [SPHERE]: interval_0_2pi,
    [TORUS]: interval_0_2pi,
    [SPIRAL]: spiral,
    [LATTICE]: interval_0_1,
    [CUBE]: cube
  };

  return (fns[type] ?? lattice_1)(i, args);
}

function interval_0_2pi(i: string) {
  return interval(d0m1, '0.', '2. * pi', i);
}

function spiral(i: string, [_, tau]: Scalar[]) {
  return interval(d0m1, '0.', ensureFloat(tau), i);
}

function interval_0_1(i: string) {
  return interval(d0, '0.', '1.', i);
}

function lattice_1(i: string) {
  return interval(d0, '-0.5', '0.5', i);
}

function interval(d: string, a: string, b: string, i: string) {
  return {
    y: `interval(${d}, ${a}, ${b}, ${i}, n)`,
    d,
  };
}

function cube(i: string, [_, l]: Scalar[]) {
  return {
    y: `init_cube(${d0}, ${ensureFloat(l)}, ${i}, n)`,
    d: d0,
  };
}
