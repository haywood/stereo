import endent from 'endent';
import screenfull from 'screenfull';

import debug from '../debug';
import { ActionInput } from './action';
import { Context, PipeInput } from './pipe';
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
    period = 20
    tp = t / period

    d0 = 2 + mod(tp, 5)
    phi = 2 * pi * (tp + audio.power)

    r = 1 / log(n)

    spiral(100 / r, r)
    Q(sin(phi))
    stereo(3)
    R(phi, 0, 1)
    R(phi, 0, 2)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput('h', 'abs(sin(2 * pi * phi * i / n))', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  s: new PipeInput('s', '1', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  v: new PipeInput('v', 'mix(abs(cos(phi)), 1, 0.3)', {
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
