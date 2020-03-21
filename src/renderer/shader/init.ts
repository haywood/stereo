import {
  Scalar,
  StepNode,
  StepType
} from '../../inputs/pipe/ast';
import { ensureFloat, resolveInt } from './common';

const {
  CUBE,
  LATTICE,
  SPHERE,
  SPIRAL,
  TORUS
} = StepType;

export function init({ type, args }: StepNode, i: string): string {
  type StepFn = (args: Scalar[], i: string) => string;

  const fns: Partial<Record<StepType, StepFn>> = {
    [SPHERE]: interval_0_2pi,
    [TORUS]: interval_0_2pi,
    [SPIRAL]: spiral,
    [LATTICE]: interval_0_1,
    [CUBE]: cube
  };

  return (fns[type] ?? lattice_1)(args, i);
}

function interval_0_2pi(args: Scalar[], i: string) {
  const d = resolveInt(args[0]) - 1;
  return interval(d, '0.', '2. * pi', i);
}

function spiral([d, tau]: Scalar[], i: string): string {
  return interval(resolveInt(d) - 1, '0.', ensureFloat(tau), i);
}

function interval_0_1(args: Scalar[], i: string): string {
  const d = resolveInt(args[0]);
  return interval(d, '0.', '1.', i);
}

function lattice_1(args: Scalar[], i: string): string {
  const d = resolveInt(args[0]);
  return interval(d, '-0.5', '0.5', i);
}

function interval(d: number, a: string, b: string, i: string): string {
  return `interval(${d}, ${a}, ${b}, i)`;
}

function cube([d, l]: Scalar[], i: string): string {
  return `init_cube(${resolveInt(d)}, ${ensureFloat(l)}, i)`;
}
