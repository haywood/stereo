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
    phi = audio.power * tan(audio.onset + t / 5)
    d0 = 4

    sphere(1)
    Q(phi, phi, phi, phi)
    stereo(3)
    `,
    { startState: Context.pipe, tabIndex: 1 }
  ),

  h: new PipeInput<Scalar>('h', '2 * audio.hue * mod(i, n / 2) / n', {
    startState: Context.scalar
  }),

  s: new PipeInput<Scalar>('s', '1', {
    startState: Context.scalar
  }),

  v: new PipeInput<Scalar>('v', 'audio.power', {
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
