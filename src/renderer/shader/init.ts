import endent from 'endent';
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

const d0m1 = `${d0} - 1`;
export function init({ type, args }: StepNode): {y: string, d: string} {
  type StepFn = (args: Scalar[]) => {y: string, d: string};

  const fns: Partial<Record<StepType, StepFn>> = {
    [SPHERE]: interval_0_2pi,
    [TORUS]: interval_0_2pi,
    [SPIRAL]: spiral,
    [LATTICE]: interval_0_1,
    [CUBE]: cube
  };

  return (fns[type] ?? lattice_1)(args);
}

function interval_0_2pi() {
  return interval(d0m1, '0.', '2. * _pi');
}

function spiral([tau]: Scalar[]) {
  return interval(d0m1, '0.', ensureFloat(tau));
}

function interval_0_1() {
  return interval(d0, '0.', '1.');
}

function lattice_1() {
  return interval(d0, '-0.5', '0.5');
}

function interval(d: string, a: string, b: string) {
  return {
    y: endent`
       interval(
           ${d},
           ${a},
           ${b},
           _i,
           _n)`,
    d,
  };
}

function cube([l]: Scalar[]) {
  const halfl = `${ensureFloat(l)} / 2.`;
  const faceSize = `round(_n / float(${d0}) / 2.`;

  return {
    y: `interval(${d0}, -${halfl}, ${halfl}, _i, ${faceSize}))`,
    d: d0,
  };
}
