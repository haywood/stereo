import { expose } from 'comlink';
import { Params } from '../params';
import { Evaluator } from './evaluator';
import { Chunk, PipelineWorker } from './types';

const worker: PipelineWorker = {
  initialize: (
    params: Params,
    chunk: Chunk,
    buffer: SharedArrayBuffer
  ): void => {
    const evaluator = new Evaluator(
      params.scope,
      params.pipe,
      params.hsv,
      chunk
    );
    evaluator.initialize(buffer);
  },

  iterate: (params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void => {
    const evaluator = new Evaluator(
      params.scope,
      params.pipe,
      params.hsv,
      chunk
    );
    evaluator.iterate(buffer);
  }
};

expose(worker);
