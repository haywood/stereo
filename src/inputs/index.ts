import endent from 'endent';
import screenfull from 'screenfull';

import debug from '../debug';
import { ActionInput } from './action';
import { Context, PipeInput } from './pipe';
import { ToggleInput } from './toggle';

const pipe = endent`
hphi = amix(t / 10, high)
mphi = amix(t / 10, mid)
lphi = amix(t / 10, low)
n = 1000000
r = hphi / 1000
tau = 10 * pi / r
d0 = 3

spiral(tau, r)
R(mphi, 0)
Q(amix(sin(lphi), lphi))
`;

const hue = endent`
abs(sin(2 * pi * hphi * i / n))
`;

const saturation = endent`
1 - high / 10
`;

const value = endent`
amix(1, mix(1, lphi, 0.5))
`;

export const inputs = {
  pipe: new PipeInput('pipe', pipe, { startState: Context.pipe, tabIndex: 1 }),

  h: new PipeInput('h', hue, {
    startState: () => Context.scalar(inputs.pipe.value?.variables ?? {})
  }),

  s: new PipeInput('s', saturation, {
    startState: () => Context.scalar(inputs.pipe.value?.variables ?? {})
  }),

  v: new PipeInput('v', value, {
    startState: () => Context.scalar(inputs.pipe.value?.variables ?? {})
  }),

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
