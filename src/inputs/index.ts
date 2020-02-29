import endent from 'endent';
import screenfull from 'screenfull';

import debug from '../debug';
import { Compiler } from '../pipe/compiler';
import { PipeNode } from '../pipe/ast';
import { renderer } from '../renderer';
import { ActionInput } from './action';
import { RangeInput } from './range';
import { TextInput } from './text';
import { ToggleInput } from './toggle';

const minDbs = parseInt(
  document.querySelector<HTMLInputElement>('#allowed_db_range_input input').min
);
const audioWorkletAvailable =
  window.AudioContext && !!new AudioContext().audioWorklet;
const compiler = new Compiler();

export const inputs = {
  pipe: new TextInput<PipeNode>(
    'pipe',
    endent`
    d0 = 4
    theta = audio.power * tan(t / 5) 
    sphere(1)
    Q(theta, theta, theta, theta)
    stereo(3)
    `,
    {
      persistent: true,
      parse: text => compiler.compile(text)
    }
  ),

  h: new TextInput('h', 'audio.hue * abs(p[0])', {
    parse: s => compiler.compile(s, 'scalar')
  }),

  s: new TextInput('s', '1', {
    parse: s => compiler.compile(s, 'scalar')
  }),

  v: new TextInput('v', '1', {
    parse: s => compiler.compile(s, 'scalar')
  }),

  animate: new ToggleInput('animate', '1'),

  mic: new ToggleInput('mic', '0', {
    disabled: !audioWorkletAvailable
  }),

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
