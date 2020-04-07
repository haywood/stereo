import screenfull from 'screenfull';

import debug from '../debug';
import { ActionInput } from './action';
import { Context, PipeInput } from './pipe';
import { ToggleInput } from './toggle';

const pipe = `
n = 1000000
r = 0.01
tu = sin(t / 10)
au = expm1(low) / expm1(1)
phi = amix(tu, au)
tau = (20 * phi * pi) + (180 * pi)
d0 = 3

spiral(tau, r)
R(2 * pi * phi, 0)

hsv(
  abs(sin(2 * pi * i / n)),
  1,
  1
)
`;

export const inputs = {
  pipe: new PipeInput('pipe', pipe, { startState: Context.pipe, tabIndex: 1 }),

  animate: new ToggleInput('animate', true),

  mic: new ToggleInput('mic', false, {
    disabled:
      !window.AudioContext || !('audioWorklet' in AudioContext.prototype),
    persistent: true
  }),

  fullscreen: new ToggleInput('fullscreen', false, {
    disabled: !screenfull.isEnabled
  }),

  save: new ActionInput('save'),

  reset: new ActionInput('reset')
};

export type Inputs = typeof inputs;

inputs.reset.stream.subscribe(() => {
  window.location.hash = '';
  window.location.reload();
});

debug('inputs', inputs);
