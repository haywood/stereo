import { print } from '../../pipe/ast';
import { Compiler } from '../../pipe/compiler';
import { PipeNode } from '../../pipe/grammar.pegjs';
import { poolSize } from '../../pipe/pool';
import debug from '../debug';
import { overlayElement } from '../overlay';
import { render } from '../renderer';
import { ActionInput } from './action';
import { RangeInput } from './range';
import { TextInput } from './text';
import { ToggleInput } from './toggle';

// Points generation is done in parallel, so pick n such
// that each chunk is size 2000
const n = 2000 * poolSize;
const minDbs = parseInt(
  overlayElement.querySelector<HTMLInputElement>(
    '#allowed_db_range_input input'
  ).min
);

const compiler = new Compiler();
export const inputs = {
  pipe: new TextInput<PipeNode>(
    'pipe',
    `${n}
      =>3
      =>torus(1, 1)
      =>R(theta, 0, 1, cos, tan)
      =>R(theta, 0, 2)
      =>R(theta, 0, 3)
      =>stereo(3)`,
    {
      persistent: true,
      parse: text => compiler.compile(text),
      stringify: print
    }
  ),

  theta: new TextInput('theta', 'pi * power + pi * t / 20', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
  }),

  h: new TextInput('h', 'chroma * abs(p[0])', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
  }),

  v: new TextInput('v', '(power + onset) / 2', {
    parse: s => compiler.compile(s, 'scalar'),
    stringify: print
  }),

  animate: new ToggleInput('animate', '1'),

  mic: new ToggleInput('mic', '0', {
    disabled: !new AudioContext().audioWorklet
  }),

  fullscreen: new ToggleInput('fullscreen', '0', {
    disabled: !document.fullscreenEnabled
  }),

  allowedDbs: new RangeInput('allowed_db_range', `${minDbs / 2}, -30`, {
    disabled: !new AudioContext().audioWorklet
  }),

  save: new ActionInput('save', async () => {
    await render();
    const blob = await new Promise(resolve =>
      document.querySelector('canvas').toBlob(resolve)
    );
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.download = `stereo${document.location.hash}`;
      a.href = url;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  })
};

export type Inputs = typeof inputs;

debug('inputs', inputs);
