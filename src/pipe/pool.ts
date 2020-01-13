import { Remote, releaseProxy, wrap } from 'comlink';

import { Data } from '../data';
import { Resolver } from './resolver';
import { Chunk, Params, PipelineWorker } from './types';

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

const initialize = (
  params: Params,
  n: number,
  buffer: SharedArrayBuffer
): Promise<void> => {
  return timing('initialization')(async () => {
    return forkJoin(n, async (chunk, w) => {
      w.initialize(params, chunk, buffer);
    });
  });
};

const iterate = (params: Params, buffer: SharedArrayBuffer) => {
  return timing('iteration')(async () => {
    return forkJoin(params.pipe.n, async (chunk, w) => {
      return w.iterate(params, chunk, buffer);
    });
  });
};

const getKey = (params: Params) =>
  JSON.stringify({
    pipe: params.pipe,
    hv: params.hv
  });

const getOrInitialize = async (params: Params): Promise<SharedArrayBuffer> => {
  const key = getKey(params);
  if (!data.has(key)) {
    const resolver = new Resolver(params.scope);
    const { n, staticFn, dynamicFn } = resolver.resolve(params.pipe);
    const buffer = Data.bufferFor(n, staticFn.d, dynamicFn.d);
    await initialize(params, n, buffer);
    data.set(key, buffer);
  }
  return data.get(key);
};

const forkJoin = async (
  n: number,
  op: (chunk: Chunk, w: PipelineWorker) => Promise<void>
) => {
  const size = Math.round(n / poolSize);
  const promises = workers.map(async (w, i) => {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    return op(chunk, await w);
  });
  await Promise.all(promises);
};

const timing = (label: string) => async <T>(op: () => Promise<T>) => {
  const start = Date.now();
  const t = await op();
  const elapsed = Date.now() - start;
  return t;
};

export const runPipeline = async (
  params: Params
): Promise<SharedArrayBuffer> => {
  const buffer = await getOrInitialize(params);
  await iterate(params, buffer);

  return buffer.slice(0);
};
