import screenfull from 'screenfull';

import debug from '../debug';
import { ActionInput } from './action';
import { Context, PipeInput } from './pipe';
import { ToggleInput } from './toggle';

const pipe = `
d0 = 4
n = 1000000
tu = sin(t / 100)
full_or_1 = amix(1, full)
full_or_tu = amix(tu, full)
abs_sin_full_or_tu = abs(sin(2 * pi * full_or_tu))
r = 0.01 * abs_sin_full_or_tu
tau = 20 * tu * pi + 180 * pi
dtheta = tu + sin(2 * pi * (low + mid + high) / 3) / 10
hue = abs(sin(2 * pi * i / n))
val = amix(1, 0.80 + 0.20 * full)

spiral(tau, r)
R(2 * pi * dtheta, 0)

hsv(hue, 1, val)
`.trim();


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
