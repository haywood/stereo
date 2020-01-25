import { expose } from 'comlink';

import { Params } from '../params';
import { Evaluator } from './evaluator';
import { Chunk } from './types';

const worker = {
  iterate: (params: Params, chunk: Chunk) => {
    const evaluator = new Evaluator(
      params.scope,
      params.pipe,
      params.hsv,
      chunk
    );
    return evaluator.iterate();
  }
};

export type PipeWorker = typeof worker;

expose(worker);
