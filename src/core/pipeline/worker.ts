import { Pipe, Params } from './pipe';
import { getLogger } from 'loglevel';
import { expose, Transfer } from "threads/worker";

const logger = getLogger('PipelineWorker');

logger.debug('new worker started');

const worker = {
    runPipeline: (params: Params, buffer: ArrayBuffer) => {
        logger.debug('received message', params);
        Pipe.run(params, buffer);
        return Transfer(buffer);
    },
};

expose(worker);
