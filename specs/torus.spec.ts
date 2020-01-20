import 'resemblejs';
import Torus from '../src/fn/torus';
import { compare, draw } from './util';

describe('Torus', () => {
  test(3, 1, 0.25);
  test(3, 1, 1);

  test(4, 1, 0.25);
  test(4, 1, 1);
});

function test(d: number, r: number, t: number) {
  const key = `torus${d}d-${r}-${t}`;

  it(key, async () => {
    const sphere = new Torus(d, r, t);

    const mismatch = await compare(await draw(sphere), key);

    expect(mismatch).toBeLessThan(0.5);
  });
}
