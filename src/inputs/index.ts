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
    phi = 0.5 / sqrt(2 * pi * t / 60)
    r = 0.0001
    d0 = 5
    spiral(100 * pi, r)
    Q(phi)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput<Scalar>('h', 'audio.hue * sin(2 * pi * i * t / n)', {
    startState: Context.scalar
  }),

  s: new PipeInput<Scalar>('s', '1', {
    startState: Context.scalar
  }),

  v: new PipeInput<Scalar>('v', '1', {
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
