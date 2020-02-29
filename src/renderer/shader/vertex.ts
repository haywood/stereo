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
import util from './glsl/util.glsl';
import { init } from './init';
import { iter } from './iter';

const reset = `

{ // reset
  copy(y, x);
  zero(y);
} // reset

`;

export function vertex({ n, steps }: PipeNode): string {
  const last = steps[steps.length - 1];
  const d = last.type == 'stereo' ? last.args[1] : last.args[0];
  return endent`
    ${uniforms}

    ${varyings}

    float x[D_MAX], y[D_MAX];

    ${util}

    void main() {
      i = position[0];

      ${init(steps[0])}

      ${steps.map(iter).join(reset)}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -100. * near / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
}
