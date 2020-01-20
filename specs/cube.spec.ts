import 'resemblejs';
import Cube from '../src/fn/cube';
import { compare, draw } from './util';

describe('Cube', () => {
  // test(2, 1); // TODO: This one draws a square that's ~1/9th the expected size
  test(3, 1);
  test(4, 1);
});

function test(d: number, l: number) {
  const key = `cube${d}d-${l}`;

  it(key, async () => {
    const cube = new Cube(d, l);

    const mismatch = await compare(await draw(cube), key);

    expect(mismatch).toBeLessThan(0.5);
  });
}
