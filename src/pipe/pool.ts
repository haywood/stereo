import { Remote, releaseProxy, wrap } from 'comlink';

import { Params } from '../params';
import { Data } from '../types';
import { Resolver } from './resolver';
import { PipeWorker } from './worker';

export const poolSize = navigator.hardwareConcurrency;
const workers = new Array<Remote<PipeWorker>>(poolSize);

export const startPool = async () => {
  for (let i = 0; i < workers.length; i++) {
    workers[i] = wrap<PipeWorker>(new Worker('./worker.ts'));
  }
};

export const stopPool = async (): Promise<void> => {
  workers.forEach(w => w[releaseProxy]());
};

export const runPipeline = async (params: Params) => {
  const resolver = new Resolver(params.scope);
  const n = resolver.resolve(params.pipe.n, 'number');
  const chunkCount = n < 2000 ? 1 : poolSize;
  const size = Math.round(n / chunkCount);

  const promises = [];
  for (let i = 0; i < chunkCount; i++) {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    const promise = workers[i]
      .iterate(params, chunk)
      .then(({ d, position, color }) => {
        return { d, position, color, offset };
      });
    promises.push(promise);
  }

  const results = await Promise.all(promises);
  const [{ d }] = results;
  const data: Data = {
    d,
    position: new Float32Array(d * n),
    color: new Float32Array(3 * n)
  };

  results.forEach(({ d, position, color, offset }) => {
    data.position.set(position, d * offset);
    data.color.set(color, 3 * offset);
  });

  return data;
};
