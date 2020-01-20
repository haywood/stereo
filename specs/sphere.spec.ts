import 'resemblejs';
import { ResembleComparisonResult } from 'resemblejs';
import { Data } from '../src/data';
import Sphere from '../src/fn/sphere';
import { worker } from '../src/web/renderer/worker';

describe('Sphere', () => {
  test(2);
  test(3);
  test(4);
});

function test(d: number) {
  const key = `${d}d`;

  it(key, async () => {
    const sphere = new Sphere(d, 1);
    const n = 19881;
    const position = new Float32Array(n * d);
    const color = new Float32Array(n * 3).fill(1);
    let i = 0;
    for (const p of sphere.sample(n, 0, n)) {
      position.set(p, d * i++);
    }
    const width = 1600;
    const height = 900;
    const canvas = document.createElement('canvas');
    canvas.height = height;
    canvas.width = width;
    worker.init(canvas.transferControlToOffscreen(), width, height);
    worker.update(new Data(n, d, position, color));

    const diff = await compare(await worker.renderPng(), `sphere${key}`);
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
  const response = await await fetch(`/base/specs/${referencePath}.png`);
  if (response.status === 404) {
    throw new Error(`reference image not found for ${referencePath}`);
  } else if (response.ok) {
    const expected = await response.blob();
    return new Promise<ResembleComparisonResult>(r =>
      resemble(actual as any)
        .compareTo(expected as any)
        .onComplete(r)
    );
  } else {
    throw new Error(
      `failed to load refrence image for ${referencePath}: ${
        response.statusText
      }: ${await response.text()}`
    );
  }
}
