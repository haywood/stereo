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
} from '../../pipe/grammar.pegjs';
import { D_MAX, from, uniforms, varyings } from './common';
import interval from './glsl/interval.glsl';
import lattice_01 from './glsl/lattice_01.glsl';
import polar2cart from './glsl/polar2cart.glsl';
import rotate from './glsl/rotate.glsl';
import sphere from './glsl/sphere.glsl';
import spiral from './glsl/spiral.glsl';
import stereo from './glsl/stereo.glsl';
import torus from './glsl/torus.glsl';
import quaternion from './glsl/quaternion.glsl';

export function iter(node: StepNode): string {
  const args = stepArgs(node);
  return endent`
  y = ${node.type}(${args.join(', ')}, x);
  `;
}

function stepArgs({ type, args }: StepNode): string[] {
  const [d, ...rest] = args.map(from);
  switch (type) {
    case 'torus':
      return [d, floatArr(rest, D_MAX)];
    case 'spiral':
    case 'sphere':
    case 'lattice':
      return [d, `float(${rest[0]})`];
    case 'rotate':
      return [d, `float(${rest[0]})`, rest[1], rest[2]];
    case 'stereo':
      return [d, rest[0]];
    case 'quaternion':
      return [d, floatArr(rest, 4)];
    default:
      throw new Error(`Can't get args for step type ${type}`);
  }
}

function floatArr(xs: string[], length: number): string {
  const values = xs.map(x => `float(${x})`);
  for (let i = 0; i < length - xs.length; i++) {
    values.push('0.');
  }
  return endent`
  float[](${values.join(', ')})
  `;
}
