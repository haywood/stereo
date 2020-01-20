import { releaseProxy, Remote, wrap } from 'comlink';
import { Data } from '../data';
import { Params } from '../params';
import { Resolver } from './resolver';
import { PipelineWorker } from './types';

export const poolSize = navigator.hardwareConcurrency;
const workers = new Array<Remote<PipelineWorker>>(poolSize);

export const startPool = async () => {
  for (let i = 0; i < workers.length; i++) {
    workers[i] = wrap<PipelineWorker>(new Worker('/stereo/pipe/worker.js'));
  }
};

export const stopPool = async (): Promise<void> => {
  workers.forEach(w => w[releaseProxy]());
};

export const runPipeline = async (params: Params) => {
  const n = params.pipe.n;
  const { fn } = new Resolver(params.scope).resolve(params.pipe);
  const buffer = Data.bufferFor(n, 1, fn.d);

  const size = Math.round(n / poolSize);
  const promises = workers.map(async (w, i) => {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    await w.iterate(params, chunk, buffer);
  });
  await Promise.all(promises);

  return buffer.slice(0);
};
