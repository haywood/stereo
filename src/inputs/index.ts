import endent from 'endent';
import screenfull from 'screenfull';

import debug from '../debug';
import { renderer } from '../renderer';
import { ActionInput } from './action';
import { Context, PipeInput } from './pipe';
import { PipeNode, Scalar } from './pipe/ast';
import { RangeInput } from './range';
import { ToggleInput } from './toggle';

const minDbs = parseInt(
  document.querySelector<HTMLInputElement>('#allowed_db_range_input input').min
);
const audioWorkletAvailable =
  window.AudioContext && !!new AudioContext().audioWorklet;

export const inputs = {
  pipe: new PipeInput(
    'pipe',
    endent`
    x0 = (1.1 - abs(sin(t / 10))) + sin(pi * audio.power)
    w = 2 * pi * i / n
    phi = w * tan(x0)
    omega = abs(cos(w * log(t)))
    r = 0.1
    d0 = 4

    spiral(phi, r)
    Q(sin(phi))
    stereo(3)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput<Scalar>('h', 'mix(omega, audio.hue, audio.onset)', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  s: new PipeInput<Scalar>('s', '1', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  v: new PipeInput<Scalar>('v', '1', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  animate: new ToggleInput('animate', '1'),

  mic: new ToggleInput('mic', '0', { disabled: !audioWorkletAvailable }),

  fullscreen: new ToggleInput('fullscreen', '0', {
    disabled: !screenfull.isEnabled
  }),

  allowedDbs: new RangeInput('allowed_db_range', `${minDbs / 2}, -30`, {
    disabled: !audioWorkletAvailable
  }),

  save: new ActionInput('save')
};

export type Inputs = typeof inputs;

debug('inputs', inputs);
