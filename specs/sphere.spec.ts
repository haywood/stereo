import 'resemblejs';
import { ResembleComparisonResult } from 'resemblejs';
import { Data } from '../src/data';
import Sphere from '../src/fn/sphere';
import { worker } from '../src/web/renderer/worker';

describe('Sphere', () => {
  test(2);
  test(3);
});

function test(d: number) {
  const key = `${d}d`;

  it(key, async () => {
    const sphere = new Sphere(d, 1);
    const n = 1000;
    const position = new Float32Array(n * d);
    const color = new Float32Array(n * 3);
    let i = 0;
    for (const p of sphere.sample(n, 0, n)) {
      position.set(p, i * d);
      color.set([0, 0, 1], i * 3);
      i++;
    }
    const width = 800;
    const height = 612;
    const canvas = document.createElement('canvas');
    canvas.height = height;
    canvas.width = width;
    worker.init(canvas.transferControlToOffscreen(), width, height);
    worker.update(new Data(n, d, position, color));

    const diff = await compare(
      await worker.renderPng(),
      `/base/specs/sphere${key}.png`
    );
    const mismatch = Number(diff.misMatchPercentage);
    if (mismatch) {
      const img = document.createElement('img');
      img.src = diff.getImageDataUrl();
      document.body.appendChild(img);
    }
    expect(mismatch).toBeLessThan(0.5);
  });
}

async function compare(actual: Blob, referencePath: string) {
  const result = await new Promise<ResembleComparisonResult>(r =>
    resemble(actual as any)
      .compareTo(referencePath)
      .ignoreColors()
      .scaleToSameSize()
      .onComplete(r)
  );
  return result;
}
