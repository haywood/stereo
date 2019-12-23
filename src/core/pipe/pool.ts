import { spawn, Worker, Pool, ModuleThread, TransferDescriptor, Transfer } from "threads";
import { getLogger } from 'loglevel';
import { Params, PipelineWorker, Chunk } from './types';
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

const initialize = async (params: Params, n: number): Promise<SharedArrayBuffer> => {
    return pool.queue(worker => worker.initialize(params, { offset: 0, size: n }));
};

const iterate = (params: Params, buffer: SharedArrayBuffer) => async (chunk: Chunk) => {
    return pool.queue(worker => worker.iterate(params, chunk, buffer));
};

const getOrInitialize = async (params: Params, n: number): Promise<SharedArrayBuffer> => {
    const key = JSON.stringify(params);
    if (!data.has(key)) {
        data.set(key, await initialize(params, n));
    }
    return data.get(key);
};

const forkJoin = async (n: number, size: number, op: (chunk: Chunk) => Promise<void>) => {
    let promises = [];
    for (let offset = 0; offset < n; offset += size) {
        const chunk = { offset, size: Math.min(n - offset, size) };
        promises.push(op(chunk));
    }
    await Promise.all(promises);
};

export const runPipeline = async (params: Params): Promise<SharedArrayBuffer> => {
    const { n } = Pipe.compile(params);
    const buffer = await getOrInitialize(params, n);
    await forkJoin(n, 1000, iterate(params, buffer));

    return buffer.slice(0);
};
