import endent from 'endent';

import { PipeNode } from '../../inputs/pipe/ast';
import { header, variables } from './common';
import vertexFns from './glsl/vertex.glsl';
import { init } from './init';
import { iter } from './iter';

const reset = `

{ // reset
  x = y;
  zero(y);
} // reset

`;

export function vertex(pipe: PipeNode): string {
  const last = pipe.steps[pipe.steps.length - 1];
  const d = last.type == 'stereo' ? last.args[1] : last.args[0];

  return endent`
    ${header(pipe.variables)}

    float[D_MAX] x, y;

    float log10(float x) {
      return log(x) / ln10;
    }

    ${vertexFns}

    void main() {
      i = position[0];
      ${variables(pipe.variables)}

      ${init(pipe.steps[0])}

      ${pipe.steps.map(iter).join(reset)}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -6. / mvPosition.z / log10(n);
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
}
