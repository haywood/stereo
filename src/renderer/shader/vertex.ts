import endent from 'endent';

import { PipeNode } from '../../inputs/pipe/ast';
import { header, variables } from './common';
import vertexFns from './glsl/vertex.glsl';
import { init } from './init';
import { iter } from './iter';

export function vertex(pipe: PipeNode): string {
  const steps = pipe.steps;
  const {y: x0, d: d0} = init(steps[0], 'position[0]');
  const {x: y} = steps.reduce(({x, d0}, s, i) => {
    const ws = '\n' + '  '.repeat(1 + steps.length - i);
    const {y, d} = iter(s, `${ws}${x}`, d0);
    return {x: y, d0: d};
  }, {x: x0, d0});

  return endent`
    ${header(pipe.variables)}

    float log10(float x) {
      return log(x) / ln10;
    }

    ${vertexFns}

    void main() {
      i = position[0];
      ${variables(pipe.variables)}

      float[D_MAX] y = ${y};

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);
      gl_PointSize = -6. / mvPosition.z / log10(n);
      gl_Position = projectionMatrix * mvPosition;
      p = gl_Position.xyz;
    }`;
}
