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
    n = 1000000
    d0 = 2 + mod(t, 8)
    phi = amix(t / 2, pi * audio.power)
    phin = phi * i / n

    r = sin(phi) / log(n)
    tau = 10 / r

    spiral(tau, r)
    R(phi, 0)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput('h', 'abs(sin(phin))', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  s: new PipeInput('s', 'amix(1, 1 - audio.power / 2)', {
    startState: (src) => Context.scalar(src, inputs.pipe.value.variables)
  }),

  v: new PipeInput('v', 'amix(1, 4 * audio.power)', {
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
