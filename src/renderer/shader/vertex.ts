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
} from '../../pipe/ast';
import { ensureFloat, from, uniforms, varyings } from './common';
import util from './glsl/util.glsl';
import { init } from './init';
import { iter } from './iter';

const reset = `

{ // reset
  copy(y, x);
  zero(y);
} // reset

`;

export function vertex(pipe: PipeNode): string {
  const last = pipe.steps[pipe.steps.length - 1];
  const d = last.type == 'stereo' ? last.args[1] : last.args[0];
  const variables = Object.entries(pipe.variables).map(([name, value]) => {
    return `float ${name} = ${ensureFloat(value)};`;
  });

  return endent`
    ${uniforms}
    ${varyings}
    ${variables.join('\n')}

    float x[D_MAX], y[D_MAX];

    ${util}

    void main() {
      i = position[0];

      ${init(pipe.steps[0])}

      ${pipe.steps.map(iter).join(reset)}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -100. * near / mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
}
