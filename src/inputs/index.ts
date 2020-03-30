import endent from 'endent';
import screenfull from 'screenfull';

import debug from '../debug';
import { ActionInput } from './action';
import { Context, PipeInput } from './pipe';
import { ToggleInput } from './toggle';

const audioWorkletAvailable =
  window.AudioContext && !!new AudioContext().audioWorklet;

export const inputs = {
  pipe: new PipeInput(
    'pipe',
    endent`
    n = 1000000
    tscale = t / pi / 10
    d0 = 2 + mod(tscale, 8)
    phi = amix(tscale, pi * power())
    phin = phi * i / n

    r = sin(phi) / log(n) 
    tau = 100 / sin(phi)

    spiral(tau, r)
    R(phi, 0)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput('h', 'abs(sin(phin))', {
    startState: () => Context.scalar(inputs.pipe.value?.variables ?? {})
  }),

  s: new PipeInput('s', 'amix(1, 1 - power() / 2)', {
    startState: () => Context.scalar(inputs.pipe.value?.variables ?? {})
  }),

  v: new PipeInput('v', 'amix(1, 4 * power())', {
    startState: () => Context.scalar(inputs.pipe.value?.variables ?? {})
  }),

  animate: new ToggleInput('animate', true),

  mic: new ToggleInput('mic', false, { disabled: !audioWorkletAvailable }),

  fullscreen: new ToggleInput('fullscreen', false, {
    disabled: !screenfull.isEnabled
  }),

  save: new ActionInput('save'),

  reset: new ActionInput('reset'),
};

export type Inputs = typeof inputs;

inputs.reset.stream.subscribe(() => {
  window.location.hash = '';
  window.location.reload();
});

debug('inputs', inputs);
