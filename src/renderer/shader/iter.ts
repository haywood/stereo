import endent from 'endent';
import { Scalar, StepNode, number } from '../../inputs/pipe/ast';
import { D_MAX, ensureFloat, ensureInt } from './common';

const {
  CUBE,
  LATTICE,
  QUATERNION,
  ROTATE,
  SPHERE,
  SPIRAL,
  STEREO,
  TORUS
} = StepNode.Type;

export function iter(
  { type, args }: StepNode,
  x: string,
  d0: string
): { y: string; d: string } {
  type StepFn = (
    args: Scalar[],
    x: string,
    d0: string
  ) => { y: string; d: string };

  const fns: Record<StepNode.Type, StepFn> = {
    [TORUS]: torus,
    [SPIRAL]: spiral,
    [SPHERE]: sphere,
    [LATTICE]: lattice,
    [CUBE]: cube,
    [ROTATE]: rotate,
    [STEREO]: stereo,
    [QUATERNION]: quaternion
  };

  return fns[type.id](args, x, d0);
}

function torus([r0, r]: Scalar[], x: string, d0: string) {
  const d = `${d0} + 1`;
  return {
    y: endent`
        torus(
          ${d},
          ${ensureFloat(r0)},
          ${ensureFloat(r)},
          ${x})`,
    d
  };
}

function spiral([_, r]: Scalar[], x: string, d0: string) {
  const d = `${d0} + 1`;
  return {
    y: endent`
        spiral(
          ${d},
          ${ensureFloat(r)},
          ${x})`,
    d
  };
}

function sphere([r]: Scalar[], x: string, d0: string) {
  const d = `${d0} + 1`;
  return {
    y: endent`
        sphere(${d},
               ${ensureFloat(r)},
               ${x})`,
    d
  };
}

function lattice([l]: Scalar[], x: string, d: string) {
  return {
    y: endent`
        lattice(
          ${d},
          ${ensureFloat(l)},
          ${x})`,
    d
  };
}

function cube([l]: Scalar[], x: string, d: string) {
  return {
    y: endent`
        cube(
          ${d},
          ${ensureFloat(l)},
          _i,
          _n,
          ${x})`,
    d
  };
}

function rotate(args: Scalar[], x: string, d: string) {
  const phi = ensureFloat(args[0]);
  const d0s = ds(args[1]);
  const d1s = ds(args[2]);

  return {
    y: endent`
        rotate(
          ${d},
          ${phi},
          ${d0s},
          ${d1s},
          ${x})`,
    d
  };

  function ds(arg: Scalar) {
    const tmp = arg ? [arg] : Array.from({length: D_MAX}).map((_, i) => number(i));
    return vector('int', tmp, '-1');
  }
}

function stereo([to]: Scalar[], x: string, from: string) {
  const d = ensureInt(to);
  return {
    y: endent`
        stereo(
          ${from},
          ${d},
          ${x})`,
    d
  };
}

function quaternion(args: Scalar[], x: string, d: string) {
  let r: string, i: string, j: string, k: string;
  if (args.length == 1) {
    r = i = j = k = ensureFloat(args[0]);
  } else {
    [r, i, j, k] = args.map(ensureFloat);
  }

  return {
    y: endent`
        quaternion(
          ${r},
          ${i},
          ${j},
          ${k},
          ${x})`,
    d
  };
}

function vector(type: 'float' | 'int', scalars: Scalar[], fill = type == 'float' ? '0.' : '0') {
  const arr = scalars.map(type == 'float' ? ensureFloat : ensureInt);
  const padding = Math.max(0, D_MAX - scalars.length);
  for (let i = 0; i < padding; i++) {
    arr.push(fill);
  }

  return `${type}[](${arr.join(', ')})`;
}
