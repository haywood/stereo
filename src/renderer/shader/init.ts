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
  return `interval(${d}, ${a}, ${b});`;
}

function cube([d, l]: Scalar[]): string {
  return `cube(${resolveInt(d)}, ${ensureFloat(l)});`;
}
