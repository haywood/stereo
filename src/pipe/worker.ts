import { getLogger } from 'loglevel';
import { expose } from 'threads/worker';

import { Evaluator } from './evaluator';
import { Chunk, Params, PipelineWorker } from './types';

const logger = getLogger('PipelineWorker');

logger.debug('new worker started');

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
