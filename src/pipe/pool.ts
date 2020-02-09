import { releaseProxy, Remote, wrap } from 'comlink';
import { Subject } from 'rxjs';
import debug from '../debug';
import { Params } from '../params';
import { DataChunk } from '../types';
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

export const runPipeline = async (
  params: Params,
  subject: Subject<DataChunk>
) => {
  const resolver = new Resolver(params.scope);
  const n = resolver.resolve(params.pipe.n, 'number');
  const chunkCount = Math.min(maxPoolSize, Math.max(1, Math.floor(n / 2_000)));
  const size = Math.round(n / chunkCount);

  adjustPoolSize(chunkCount);

  const promises = [];
  for (let i = 0; i < chunkCount; i++) {
    const offset = i * size;
    const chunk = { offset, size: Math.min(size, n - offset) };
    promises.push(
      workers[i].iterate(params, chunk).then(chunk => {
        subject.next(chunk);
      })
    );
  }
  await Promise.all(promises);
};
