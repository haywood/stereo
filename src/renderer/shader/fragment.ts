import endent from 'endent';

import { HSV } from '../../params';
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
} from '../pipe/grammar.pegjs';
import { from, isFloat, uniforms, varyings } from './common';
import hsv2rgb from './glsl/hsv2rgb.glsl';

const fragmentFunctions = [hsv2rgb];

export function fragment(hsv: HSV): string {
  const ensureFloat = (x: Scalar) =>
    isFloat(x) ? from(x) : `float(${from(x)})`;
  const h = ensureFloat(hsv.h);
  const s = ensureFloat(hsv.s);
  const v = ensureFloat(hsv.v);

  return endent`
    ${uniforms}

    ${varyings}

    ${fragmentFunctions.join('\n')}

    void main() {
      float h = ${h} * 360.;
      float s = ${s};
      float v = ${v};

      gl_FragColor = vec4(hsv2rgb(h, s, v), 1.);
    }
    `;
}
