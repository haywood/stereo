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
import lattice from './glsl/lattice.glsl';
import quaternion from './glsl/quaternion.glsl';
import cube from './glsl/cube.glsl';
import { init } from './init';
import { iter } from './iter';

const vertexFunctions = [
  interval,
  lattice,
  cube,
  polar2cart,
  rotate,
  sphere,
  stereo,
  torus,
  spiral,
  quaternion
];

export function vertex({ n, steps }: PipeNode): string {
  const last = steps[steps.length - 1];
  const d = last.type == 'stereo' ? last.args[1] : last.args[0];

  return endent`
    ${uniforms}

    ${varyings}

    float x[D_MAX], y[D_MAX];

    void reset() {
      for (int k = 0; k < D_MAX; k++) {
        x[k] = y[k];
        y[k] = 0.;
      }
    }

    ${vertexFunctions.join('\n')}

    void main() {
      i = position[0];

      ${init(steps[0])}

      ${steps.map(iter).join('\nreset();\n\n')}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -100. * near / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
}
