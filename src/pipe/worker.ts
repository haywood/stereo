import { expose } from 'comlink';

import { Evaluator } from './evaluator';
import { Chunk, Params, PipelineWorker } from './types';

const worker: PipelineWorker = {
  initialize: (
    params: Params,
    chunk: Chunk,
    buffer: SharedArrayBuffer
  ): void => {
    new Evaluator(params.scope, params.pipe, params.hv, chunk).initialize(
      buffer
    );
  },

  iterate: (params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void => {
    new Evaluator(params.scope, params.pipe, params.hv, chunk).iterate(buffer);
  }
};

expose(worker);
