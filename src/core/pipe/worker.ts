import { Pipe } from './pipe';
import { getLogger } from 'loglevel';
import { expose } from "threads/worker";
import { Params, Chunk, PipelineWorker } from './types';

const logger = getLogger('PipelineWorker');

logger.debug('new worker started');

const worker: PipelineWorker = {
    initialize: (params: Params, chunk: Chunk) => {
        return Pipe.evaluatorFor(params, chunk).initialize();
    },

    iterate: (params: Params, chunk: Chunk, buffer: SharedArrayBuffer) => {
        return Pipe.evaluatorFor(params, chunk).iterate(buffer);
    }
};

expose(worker);
