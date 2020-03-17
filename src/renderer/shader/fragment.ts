import endent from 'endent';

import { HSV } from '../../types';
import { Variables } from '../../inputs/pipe/ast';
import { header, ensureFloat, variables } from './common';
import hsv2rgb from './glsl/hsv2rgb.glsl';
import util from './glsl/util.glsl';

const fragmentFunctions = [util, hsv2rgb];

export function fragment(hsv: HSV, vs: Variables): string {
  const h = ensureFloat(hsv.h);
  const s = ensureFloat(hsv.s);
  const v = ensureFloat(hsv.v);

  return endent`
    ${header(vs)}

    ${fragmentFunctions.join('\n')}

    void main() {
      ${variables(vs)}
      float h = ${h} * 360.;
      float s = ${s};
      float v = ${v};

      gl_FragColor = vec4(hsv2rgb(h, s, v), 1.);
    }
    `;
}
