import endent from 'endent';

import { HSV } from '../../types';
import { Variables } from '../../inputs/pipe/ast';
import { header, ensureFloat, variables } from './common';
import fragmentFns from './glsl/fragment.glsl';

export function fragment(hsv: HSV, vs: Variables): string {
  const h = ensureFloat(hsv.h);
  const s = ensureFloat(hsv.s);
  const v = ensureFloat(hsv.v);

  return endent`
    ${header()}

    ${fragmentFns}

    void main() {
      ${variables(vs)}

      if (_i > _n) return;

      float h = ${h} * 360.;
      float s = ${s};
      float v = ${v};

      gl_FragColor = vec4(hsv2rgb(h, s, v), 1.);
    }
    `;
}
