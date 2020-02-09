import { expose } from 'comlink';

import { Params } from '../params';
import { Chunk, DataChunk } from '../types';
import { Evaluator } from './evaluator';

const worker = {
  iterate: (params: Params, chunk: Chunk): DataChunk => {
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
