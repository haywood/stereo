import { Remote, releaseProxy, wrap } from 'comlink';

import { Params } from '../params';
import { Data } from '../types';
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
  const n = params.pipe.n;
  const size = Math.round(n / poolSize);

  const promises = workers.map(async (w: Remote<PipeWorker>, i) => {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    const { d, position, color } = await w.iterate(params, chunk);
    return { d, position, color, offset };
  });

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
