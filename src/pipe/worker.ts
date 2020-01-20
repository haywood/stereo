import { expose } from 'comlink';
import { Params } from '../params';
import { Evaluator } from './evaluator';
import { Chunk } from './types';

const worker = {
  iterate: (params: Params, chunk: Chunk, buffer: SharedArrayBuffer) => {
    const evaluator = new Evaluator(
      params.scope,
      params.pipe,
      params.hsv,
      chunk
    );
    evaluator.iterate(buffer);
  }
};

export type Worker = typeof worker;

export const newWorker = () => new Worker('/stereo/pipe/worker.js');

expose(worker);
