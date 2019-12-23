import { spawn, Worker, Pool, ModuleThread, TransferDescriptor, Transfer } from "threads";
import { getLogger } from 'loglevel';
import { Params, PipelineWorker } from './types';
import { Pipe } from "./pipe";

const logger = getLogger('PipelinePool');
let pool: Pool<ModuleThread<PipelineWorker>>;
let data: Map<string, SharedArrayBuffer>;

export const startPool = (size: number) => {
    logger.info('starting worker pool');
    pool = Pool(() => spawn(new Worker('./worker')), size);
    data = new Map();

    pool.events().subscribe((event: any) => {
        if (event.error) {
            logger.error('received error event from worker pool', event);
        }
    });
};

export const stopPool = async (): Promise<boolean> => {
    logger.info('waiting for pending tasks to complete before terminating pool');
    return await pool.completed(true)
        .then(() => {
            logger.info('terminating pool');
            pool.terminate();
        })
        .then(() => true)
        .catch(err => {
            logger.error('error terminating worker pool', err);
            return false;
        })
        .finally(() => {
            logger.info('resetting data');
            data.clear(); // not necessary?
            pool = null;
        });
};

export const runPipeline = async (params: Params): Promise<ArrayBuffer> => {
    const key = JSON.stringify(params);
    const { n } = Pipe.compile(params);
    const size = 1000;
    let buffer = data.get(key);
    if (!buffer) {
        buffer = await pool.queue(worker => worker.initialize(params));
        data.set(key, buffer);
    }
    let promises = [];
    for (let offset = 0; offset < n; offset += size) {
        const chunk = { offset, size: Math.min(n - offset, size) };
        promises.push(pool.queue(worker => worker.iterate(params, chunk, buffer)));
    }
    await Promise.all(promises);

    return buffer.slice(0);
};
