import { poolSize } from '../../core/pipe/pool';
import debug from '../debug';
import { renderer } from '../renderer';
import { TextInput } from './text';
import { ToggleInput } from './toggle';
import { RangeInput } from './range';
import { ActionInput } from './action';

// Points generation is done in parallel, so pick n such
// that each chunk is size 2000
const n = 2000 * poolSize;

export const inputs = {
  pipe: new TextInput(
    'pipe',
    `
    ${n}
      ->3
      ->torus(1, 1)
      ->R(theta, 0, 1, cos, tan)
      ->R(theta, 0, 2)
      ->R(theta, 0, 3)
      ->stereo(3)`.trim(),
    {
      persistent: true,
      stringify: text => text.replace(/\s*(->|=>)\s*/g, '\n  ->').trim(),
    },
  ),
  theta: new TextInput('theta', 'pi * power + pi * t / 20'),
  h: new TextInput('h', 'chroma * abs(p[0])'),
  v: new TextInput('v', '(power + onset) / 2'),
  animate: new ToggleInput('animate', true),
  mic: new ToggleInput('mic', false, {
    disabled: !new AudioContext().audioWorklet,
  }),
  fullscreen: new ToggleInput('fullscreen', false, {
    disabled: !document.fullscreenEnabled,
  }),
  allowedDbs: new RangeInput('allowed_db_range', [-130, -30], {
    disabled: !new AudioContext().audioWorklet,
  }),
  save: new ActionInput('save', async () => {
    const canvas = renderer.domElement;
    renderer.render();
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.download = `stereo${document.location.hash}`;
      a.href = url;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }),
};

export type Inputs = typeof inputs;

debug('inputs', inputs);
