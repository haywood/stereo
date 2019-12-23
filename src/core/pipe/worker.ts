import { Pipe } from './pipe';
import { getLogger } from 'loglevel';
import { expose, Transfer } from "threads/worker";
import { Params } from './types';

const logger = getLogger('PipelineWorker');

logger.debug('new worker started');

const worker = {
    initialize: (params: Params) => {
        return Pipe.evaluatorFor(params).initialize();
    },

    iterate: (params: Params, buffer: SharedArrayBuffer) => {
        return Pipe.evaluatorFor(params).iterate(buffer);
    }
};

expose(worker);
