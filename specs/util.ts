import resemble, { ResembleComparisonResult } from 'resemblejs';
import { Fn } from '../src/fn';
import { worker } from '../src/renderer/worker';

export async function draw(fn: Fn, n: number = 20_000) {
  const position = new Float32Array(n * fn.d);
  const color = new Float32Array(n * 3).fill(1);
  let i = 0;
  for (const p of fn.sample(n, 0, n)) {
    position.set(p, fn.d * i++);
  }
  const width = 1600;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  worker.init(canvas, width, height);
  worker.update({ d: fn.d, position, color });
  return worker.renderPng();
}

export async function compare(actual: Blob, referenceKey: string) {
  const response = await fetch(`/base/specs/${referenceKey}.png`);
  if (response.status === 404) {
    throw new Error(`reference image not found for ${referenceKey}`);
  } else if (response.ok) {
    const expected = await response.blob();
    const diff = await new Promise<ResembleComparisonResult>(r =>
      resemble(actual as any)
        .compareTo(expected as any)
        .onComplete(r)
    );
    const mismatch = Number(diff.misMatchPercentage);
    if (mismatch) {
      const img = document.createElement('img');
      img.id = referenceKey;
      img.src = diff.getImageDataUrl();
      document.body.appendChild(img);
    }
    return mismatch;
  } else {
    throw new Error(
      `failed to load refrence image for ${referenceKey}: ${
        response.statusText
      }: ${await response.text()}`
    );
  }
}
