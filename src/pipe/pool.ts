import { releaseProxy, Remote, wrap } from 'comlink';
import { Data } from '../data';
import { Params } from '../params';
import { Resolver } from './resolver';
import { PipelineWorker } from './types';

const data = new Map<string, SharedArrayBuffer>();

export const poolSize = navigator.hardwareConcurrency;
const workers = new Array<Promise<Remote<PipelineWorker>>>(poolSize);

export const startPool = async () => {
  for (let i = 0; i < workers.length; i++) {
    workers[i] = new Promise(r =>
      r(wrap<PipelineWorker>(new Worker('/stereo/pipe/worker.js')))
    );
  }
};

export const stopPool = async (): Promise<void> => {
  workers.forEach(w => w[releaseProxy]());
};

const getKey = (params: Params) =>
  JSON.stringify({
    pipe: params.pipe,
    hv: params.hv
  });

export const runPipeline = async (params: Params) => {
  const key = getKey(params),
    n = params.pipe.n,
    cached = data.has(key);
  let buffer = data.get(key);

  if (!cached) {
    const resolver = new Resolver(params.scope);
    const { staticFn, dynamicFn } = resolver.resolve(params.pipe);
    buffer = Data.bufferFor(n, staticFn.d, dynamicFn.d);
    data.set(key, buffer);
  }

  const size = Math.round(n / poolSize);
  const promises = workers.map(async (w, i) => {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    if (!cached) {
      await (await w).initialize(params, chunk, buffer);
    }
    await (await w).iterate(params, chunk, buffer);
  });
  await Promise.all(promises);

  return buffer.slice(0);
};
