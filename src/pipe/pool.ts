import { releaseProxy, Remote, wrap } from 'comlink';
import debug from '../debug';
import { Params } from '../params';
import { Data } from '../types';
import { Resolver } from './resolver';
import { PipeWorker } from './worker';

export const maxPoolSize = navigator.hardwareConcurrency || 2;
debug('maxPoolSize', maxPoolSize);
const workers: Remote<PipeWorker>[] = [];

function adjustPoolSize(targetSize: number) {
  while (workers.length < targetSize) {
    workers.push(wrap<PipeWorker>(new Worker('./worker.ts')));
  }

  while (workers.length > targetSize) {
    workers.pop()[releaseProxy]();
  }

  debug('poolSize', workers.length);
  debug('targetPoolSize', targetSize);
}

export const runPipeline = async (params: Params) => {
  const resolver = new Resolver(params.scope);
  const n = resolver.resolve(params.pipe.n, 'number');
  const chunkCount = Math.min(maxPoolSize, Math.max(1, Math.floor(n / 2_000)));
  const size = Math.round(n / chunkCount);

  adjustPoolSize(chunkCount);

  const promises = [];
  const chunks = [];
  for (let i = 0; i < chunkCount; i++) {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    const promise = workers[i]
      .iterate(params, chunk)
      .then(({ d, position, color }) => {
        return { d, position, color, offset };
      });
    promises.push(promise);
    chunks.push(chunk);
  }
  debug('chunks', chunks);

  const results = await Promise.all(promises);
  debug('results', results);
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
