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
    phi = 2 * pi * log(t) / 10
    omega = abs(cos(phi * i / n))
    step = 2 * audio.power
    r = 0.001
    d0 = 3

    spiral(100 * pi, r)
    Q(mix(sin(phi), audio.power, step))
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput<Scalar>('h', 'mix(omega, audio.hue, step)', {
    startState: Context.scalar
  }),

  s: new PipeInput<Scalar>('s', 'mix(omega, audio.power, step)', {
    startState: Context.scalar
  }),

  v: new PipeInput<Scalar>('v', 'mix(omega, audio.onset, step)', {
    startState: Context.scalar
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
