import 'resemblejs';
import Spiral from '../src/fn/spiral';
import { compare, draw } from './util';

describe('Spiral', () => {
  test(2, 1, 0.25);
  test(2, 1, 1);

  test(3, 1, 0.25);
  test(3, 1, 1);

  test(4, 1, 0.25);
  test(4, 1, 1);
});

function test(d: number, a: number, k: number) {
  const key = `spiral${d}d-${a}-${k}`;

  it(key, async () => {
    const sphere = new Spiral(
      d,
      new Array(d).fill(a),
      new Array(d - 1).fill(k)
    );

    const mismatch = await compare(await draw(sphere), key);

    expect(mismatch).toBeLessThan(0.5);
  });
}
