import { releaseProxy, Remote, wrap } from 'comlink';
import { Data } from '../data';
import { Params } from '../params';
import { Resolver } from './resolver';
import { newWorker, Worker } from './worker';

export const poolSize = navigator.hardwareConcurrency;
const workers = new Array<Remote<Worker>>(poolSize);

export const startPool = async () => {
  for (let i = 0; i < workers.length; i++) {
    workers[i] = wrap<Worker>(newWorker());
  }
};

export const stopPool = async (): Promise<void> => {
  workers.forEach(w => w[releaseProxy]());
};

export const runPipeline = async (params: Params) => {
  const n = params.pipe.n;
  const { fn } = new Resolver(params.scope).resolve(params.pipe);
  const buffer = Data.bufferFor(n, 1, fn.d);
  const data = new Float32Array(buffer);

  const size = Math.round(n / poolSize);
  const promises = workers.map(async (w: Remote<Worker>, i) => {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    const { position, color } = await w.iterate(params, chunk, buffer);
    Data.position(data).set(position, fn.d * offset);
    Data.color(data).set(color, 3 * offset);
  });
  await Promise.all(promises);

  return buffer.slice(0);
};
