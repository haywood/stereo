import endent from 'endent';

import {
  Scalar,
  StepNode,
  StepType,
} from '../../inputs/pipe/ast';

import {
  ensureFloat,
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
  const d = resolveInt(args[0]);
  const rs = [];

  for (let i = 1; i < Math.min(d + 1, args.length); i++) {
    rs.push(ensureFloat(args[i]));
  }

  const padding = 10 - rs.length;
  for (let i = 0; i < padding; i++) {
    rs.push('0.');
  }

  const r = `float[](${rs.join(', ')})`;
  return `torus(${d}, ${r}, x)`;
}

function spiral([d, _, r]: Scalar[]) {
  return `spiral(${resolveInt(d)}, ${ensureFloat(r)}, x)`;
}

function sphere([d, r]: Scalar[]) {
  return `sphere(${resolveInt(d)}, ${ensureFloat(r)}, x)`;
}

function lattice(args: Scalar[]) {
  const d = resolveInt(args[0]);
  const l = ensureFloat(args[1]);

  return `lattice(${d}, ${l}, x)`;
}

function cube([d, l]: Scalar[]) {
  return `cube(${resolveInt(d)}, ${ensureFloat(l)}, x)`;
}

function rotate([d, phi, d0, d1]: Scalar[]) {
  return `rotate(${resolveInt(d)}, ${ensureFloat(phi)}, ${resolveInt(d0)}, ${resolveInt(d1)}, x)`;
}

function stereo([from, to]: Scalar[]) {
  return `stereo(${resolveInt(from)}, ${resolveInt(to)}, x)`;
}

function quaternion(args: Scalar[]) {
  let r, i, j, k;
  if (args.length == 2) {
    r = i = j = k = ensureFloat(args[1]);
  } else {
    [r, i, j, k] = args.slice(1).map(ensureFloat);
  }

  return `quaternion(${r}, ${i}, ${j}, ${k}, x)`;
}

function polar2cart(d: number, r: Scalar) {
  return `polar2cart(${d}, ${ensureFloat(r)})`;
}
