import { spawn, Worker, Pool, ModuleThread, TransferDescriptor, Transfer } from "threads";
import { getLogger } from 'loglevel';
import { Data } from "../data";
import { Pipe, Params } from "./pipe";

const logger = getLogger('PipelinePool');
type PipelineWorker = {
    runPipeline(
        params: Params,
        buffer: SharedArrayBuffer
    ): SharedArrayBuffer;
};

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
    if (!data.has(params.pipe)) {
        const { n, init, iter } = Pipe.parse(params);
        data.set(params.pipe, Data.bufferFor(n, init.d, iter.d));
    }
    const buffer = data.get(params.pipe);

    const result = await pool
        .queue((worker) => worker.runPipeline(params, buffer));
    return result;
};
