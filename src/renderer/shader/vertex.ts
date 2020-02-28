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
import { from, uniforms, varyings } from './common';
import interval from './glsl/interval.glsl';
import polar2cart from './glsl/polar2cart.glsl';
import rotate from './glsl/rotate.glsl';
import sphere from './glsl/sphere.glsl';
import spiral from './glsl/spiral.glsl';
import stereo from './glsl/stereo.glsl';
import torus from './glsl/torus.glsl';
import { init } from './init';
import { iter } from './iter';

const vertexFunctions = [
  interval,
  polar2cart,
  rotate,
  sphere,
  stereo,
  torus,
  spiral
];

// TODO support for additional step types:
// cube
// lattice
// quaternion

export function vertex({ n, steps }: PipeNode): string {
  const last = steps[steps.length - 1];
  const d = last.type == 'stereo' ? last.args[1] : last.args[0];

  return endent`
    ${uniforms}

    ${varyings}

    ${vertexFunctions.join('\n')}

    void main() {
      float[D_MAX] x, y;

      ${init(steps[0])}

      ${steps.map(iter).join('\nx = y;\n\n')}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -400. * near / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
}
