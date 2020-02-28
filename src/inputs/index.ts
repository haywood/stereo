import screenfull from 'screenfull';

import debug from '../debug';
import { print } from '../pipe/ast';
import { Compiler } from '../pipe/compiler';
import { PipeNode } from '../pipe/grammar.pegjs';
import { renderer } from '../renderer';
import { ActionInput } from './action';
import { RangeInput } from './range';
import { TextInput } from './text';
import { ToggleInput } from './toggle';

// A good default. Reasonable level of detail without too much resource
// consumption.
const n = Math.round((window.screen.width * window.screen.height) / 50);
const minDbs = parseInt(
  document.querySelector<HTMLInputElement>('#allowed_db_range_input input').min
);
const audioWorkletAvailable =
  window.AudioContext && !!new AudioContext().audioWorklet;
const compiler = new Compiler();

export const inputs = {
  pipe: new TextInput<PipeNode>(
    'pipe',
    `${n}
      =>4
      =>torus(1, 1, 1)
      =>R(theta, 0, 1)
      =>R(theta, 0, 2)
      =>R(theta, 0, 3)
      =>R(theta, 1, 2)
      =>R(theta, 1, 3)
      =>R(theta, 2, 3)
      =>stereo(3)`,
    {
      persistent: true,
      parse: text => compiler.compile(text),
      stringify: print
    }
  ),

  theta: new TextInput('theta', 't / 5 + audio.power', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
  }),

  h: new TextInput('h', 'audio.hue * abs(p[0])', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
  }),

  s: new TextInput('s', '1', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
  }),

  v: new TextInput('v', '1', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
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
