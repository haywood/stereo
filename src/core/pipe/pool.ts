import { spawn, Worker, Pool, ModuleThread, TransferDescriptor, Transfer } from "threads";
import { getLogger } from 'loglevel';
import { Data } from "../data";
import { Pipe } from "./pipe";
import { Params } from './types';
import { pp } from "../pp";

const logger = getLogger('PipelinePool');
type PipelineWorker = {
    runPipeline(
        params: Params,
        buffer: SharedArrayBuffer
    ): void;
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
    try {
        if (!data.has(params.pipe)) {
            const { n, init, iter } = Pipe.parse(params);
            data.set(params.pipe, Data.bufferFor(n, init.d, iter.d));
        }
        const buffer = data.get(params.pipe);
        await pool.queue((worker) => worker.runPipeline(params, buffer));
        return buffer.slice(0);
    } catch (err) {
        if (err.location) {
            console.error(`peg error '${err.message}' at ${pp(err.location)}`);
        } else {
            console.error(err);
        }
        return new ArrayBuffer(0);
    }
};
