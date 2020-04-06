import endent from 'endent';

import { PipeNode } from '../../inputs/pipe/ast';
import { header, variables, ensureFloat } from './common';
import vertexFns from './glsl/vertex.glsl';
import { init } from './init';
import { iter } from './iter';

export function vertex(pipe: PipeNode): string {
  const { y: x0, d: d0 } = init(pipe.steps[0]);
  const steps = [], colors = [];
  let d = d0;

  for (const s of pipe.steps) {
    const tmp = iter(s, 'x', d);
    steps.push(tmp.y);
    d = tmp.d;
  }

  for (const c of pipe.colors) {
    const expr = endent`
    ${c.mode}(
      ${c.args.map(ensureFloat).join(',\n')}
    )
    `;
    colors.push(expr);
  }

  return endent`
    ${header()}

    ${vertexFns}

    void main() {
      _i = position[0];
      ${variables(pipe.variables)}

      if (_i > _n) return;

      float[D_MAX] y, x = ${x0};
      ${steps.map(y => `y = ${y};`).join('\nx = y;\n')}
      ${colors.map(c => `color = ${c};`).join('\n')}

      vec4 mvPosition = modelViewMatrix * vec4(y[0], y[1], y[2], 1.);

      gl_PointSize = log(dpr * 25. / -mvPosition.z / log10(_n));
      gl_Position = projectionMatrix * mvPosition;
    }`;
}
