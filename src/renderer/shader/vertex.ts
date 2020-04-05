import endent from 'endent';

import { PipeNode } from '../../inputs/pipe/ast';
import { header, variables } from './common';
import vertexFns from './glsl/vertex.glsl';
import { init } from './init';
import { iter } from './iter';

export function vertex(pipe: PipeNode): string {
  const steps = pipe.steps;
  const { y: x0, d: d0 } = init(steps[0]);
  const { x: y } = steps.reduce(
    ({ x, d0 }, s) => {
      const { y, d } = iter(s, x, d0);
      return { x: y, d0: d };
    },
    { x: x0, d0 }
  );

  return endent`
    ${header()}

    ${vertexFns}

    void main() {
      _i = position[0];
      ${variables(pipe.variables)}

      if (_i > _n) return;

      float[D_MAX] y =
        ${y};

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);

      gl_PointSize = log(dpr * 25. / -mvPosition.z / log10(_n));
      gl_Position = projectionMatrix * mvPosition;
    }`;
}
