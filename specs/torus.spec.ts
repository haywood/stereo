import Torus from '../src/fn/torus';
import { compare, draw } from './util';

describe('Torus', () => {
  test(3, new Float32Array([1, 0.5]));
  test(3, new Float32Array([1, 1]));

  test(4, new Float32Array([1, 0.5, 0.25]));
  test(4, new Float32Array([1, 1, 1]));
});

function test(d: number, r: Float32Array) {
  const key = `torus${d}d-${r}`;

  it(key, async () => {
    const torus = new Torus(d, r);

    const mismatch = await compare(await draw(torus), key);

    expect(mismatch).toBeLessThan(0.5);
  });
}
