import { runPipeline, Params } from '../core/pipeline';
import { getLogger } from 'loglevel';

const logger = getLogger('PipelineWorker');

self.onmessage = (event: MessageEvent) => {
    logger.debug('received message', event);
    (self as any).postMessage(runPipeline(event.data as Params));
};