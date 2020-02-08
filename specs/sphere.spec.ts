import Sphere from '../src/fn/sphere';
import { compare, draw } from './util';

fdescribe('Sphere', () => {
  test(2);
  test(3);
  test(4);
});

function test(d: number) {
  const key = `${d}d`;

  it(key, async () => {
    const sphere = new Sphere(d, 1);

    const mismatch = await compare(await draw(sphere), `sphere${key}`);

    expect(mismatch).toBeLessThan(0.1);
  });
}
