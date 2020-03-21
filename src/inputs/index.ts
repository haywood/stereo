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
    d0 = 2 + mod(t / 10, 5)
    n = 1000000
    phi = t / pi + pi * audio.power
    r = 1 / log(n)

    spiral(100 / r, r)
    Q(sin(phi))
    stereo(3)
    R(phi)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput('h', 'abs(sin(phi * i / n))', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  s: new PipeInput('s', '1', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  v: new PipeInput('v', '(1 + abs(cos(phi))) / 2', {
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
