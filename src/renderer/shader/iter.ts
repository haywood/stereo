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

export function iter({ type, args }: StepNode, x: string, d0: string): {y: string, d: string} {
  type StepFn = (args: Scalar[], x: string, d0: string) => {y: string, d: string};

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

  return fns[type](args, x, d0);
}

function torus(args: Scalar[], x: string, d0: string) {
  const rs = [];

  for (let i = 1; i < args.length; i++) {
    rs.push(ensureFloat(args[i]));
  }

  const padding = 10 - rs.length;
  for (let i = 0; i < padding; i++) {
    rs.push('0.');
  }

  const r = `float[](${rs.join(', ')})`;
  const d = `${d0} + 1`;
  return {y: `torus(${d}, ${r}, ${x})`, d};
}

function spiral([_0, _1, r]: Scalar[], x: string, d0: string) {
  const d = `${d0} + 1`;
  return {
    y: `spiral(${d}, ${ensureFloat(r)}, ${x})`,
    d,
  };
}

function sphere([_, r]: Scalar[], x: string, d0: string) {
  const d = `${d0} + 1`
  return {
    y: `sphere(${d}, ${ensureFloat(r)}, ${x})`,
    d,
  };
}

function lattice([_, l]: Scalar[], x: string, d: string) {
  return {
    y: `lattice(${d}, ${ensureFloat(l)}, ${x})`,
    d,
  };
}

function cube([_, l]: Scalar[], x: string, d: string) {
  return {
    y: `cube(${d}, ${ensureFloat(l)}, ${x}, n)`,
    d,
  };
}

function rotate([_, phi, d0, d1]: Scalar[], x: string, d: string) {
  return {
    y: `rotate(${d}, ${ensureFloat(phi)}, ${resolveInt(d0)}, ${resolveInt(d1)}, ${x})`,
    d,
  };
}

function stereo([_, to]: Scalar[], x: string, from: string) {
  const d = to;
  return {
    y: `stereo(${from}, ${resolveInt(to)}, ${x})`,
    d,
  }
}

function quaternion(args: Scalar[], x: string, d: string) {
  let r, i, j, k;
  if (args.length == 2) {
    r = i = j = k = ensureFloat(args[1]);
  } else {
    [r, i, j, k] = args.slice(1).map(ensureFloat);
  }

  return {
    y: `quaternion(${r}, ${i}, ${j}, ${k}, ${x})`,
    d,
  };
}
