import { spawn, Thread, Worker, Pool } from "threads"
import { getLogger } from 'loglevel';

const logger = getLogger('PipelinePool');

export const createPool = (size: number) => {
    logger.info('starting worker pool');
    const pool = Pool(() => spawn(new Worker('./worker')), size);

    pool.events().subscribe((event: any) => {
        if (event.error) {
            logger.error('received error event from worker pool', event);
        }
    });

    return pool;
}