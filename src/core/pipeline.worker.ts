import { runPipeline, Params } from './pipeline';
import { getLogger } from 'loglevel';
import { expose } from "threads/worker"

const logger = getLogger('PipelineWorker');

logger.info('new worker started');

expose((params: Params) => {
    logger.debug('received message', params);
    return runPipeline(params);
});