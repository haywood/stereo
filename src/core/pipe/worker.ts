import { Pipe } from './pipe';
import { getLogger } from 'loglevel';
import { expose, Transfer } from "threads/worker";
import { Params } from './types';

const logger = getLogger('PipelineWorker');

logger.debug('new worker started');

const worker = {
    runPipeline: (params: Params, buffer?: SharedArrayBuffer) => {
        logger.debug('received message', params);
        try {
            return Pipe.run(params, buffer);
        } catch (err) {
            logger.error(err);
        }
    },
};

expose(worker);
