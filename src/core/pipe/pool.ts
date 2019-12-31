import { spawn, Worker, Pool, ModuleThread } from "threads";
import { getLogger } from 'loglevel';
import { Params, PipelineWorker, Chunk } from './types';
import { Pipe } from "./pipe";
import { ceil } from "mathjs";
import { Data } from "../data";

const logger = getLogger('PipelinePool');
let pool: Pool<ModuleThread<PipelineWorker>>;
let data: Map<string, SharedArrayBuffer>;
logger.setLevel('info');
let poolSize = 0;

export const startPool = async (size: number) => {
    logger.info('starting worker pool');
    pool = Pool(() => spawn(new Worker('./pipe.worker')), size);
    poolSize = size;
    data = new Map();
    let promises = [];
    for (let i = 0; i < size; i++) {
        // pre-load scripts so the first task doesn't take forever
        promises.push(pool.queue(async () => { }));
    }
    await Promise.all(promises);
};

export const stopPool = async (): Promise<void> => {
    logger.info('waiting for pending tasks to complete before terminating pool');
    try {
        await pool.terminate(true);
    } catch (err) {
        logger.error(err);
    } finally {
        pool = null;
    }
};

const initialize = (params: Params, n: number, buffer: SharedArrayBuffer): Promise<void> => {
    return timing('initialization')(async () => {
        return forkJoin(n, async (chunk) => {
            return pool.queue(w => w.initialize(params, chunk, buffer));
        });
    });
};

const iterate = (params: Params, n: number, buffer: SharedArrayBuffer) => {
    return timing('iteration')(async () => {
        return forkJoin(n, async (chunk) => {
            return pool.queue(w => w.iterate(params, chunk, buffer));
        });
    });
};

const getKey = (params: Params) => JSON.stringify({
    pipe: params.pipe,
    theta: params.theta,
    h: params.h,
    l: params.v,
});

const getOrInitialize = async (params: Params, n: number, d0: number, d: number): Promise<SharedArrayBuffer> => {
    const key = getKey(params);
    if (!data.has(key)) {
        const buffer = Data.bufferFor(n, d0, d);
        await initialize(params, n, buffer);
        data.set(key, buffer);
    }
    return data.get(key);
};

const forkJoin = async (n: number, op: (chunk: Chunk) => Promise<void>) => {
    const size = ceil(n / poolSize);
    let promises = [];
    for (let offset = 0; offset < n; offset += size) {
        const chunk = { offset, size: Math.min(n - offset, size) };
        promises.push(op(chunk));
    }
    await Promise.all(promises);
};

const timing = (label: string) => async<T>(op: () => Promise<T>) => {
    const start = Date.now();
    const t = await op();
    const elapsed = Date.now() - start;
    logger.debug(`${label} took ${elapsed}ms`);
    return t;
};

export const runPipeline = async (params: Params): Promise<SharedArrayBuffer> => {
    const { n, init, iter } = Pipe.compile(params);
    const buffer = await getOrInitialize(params, n, init.d, iter.d);
    await iterate(params, n, buffer);

    return buffer.slice(0);
};
