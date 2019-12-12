import { spawn, Thread, Worker, Pool, FunctionThread } from "threads"
import { getLogger } from 'loglevel';
import { Params } from "./pipeline";
import { Data } from "../data";

const logger = getLogger('PipelinePool');
let pool: Pool<FunctionThread<Params[], Data>>;

export const startPool = (size: number) => {
    logger.info('starting worker pool');
    pool = Pool(() => spawn(new Worker('./worker')), size);

    pool.events().subscribe((event: any) => {
        if (event.error) {
            logger.error('received error event from worker pool', event);
        }
    });
}

export const stopPool = async (): Promise<boolean> =>
    await pool.terminate()
        .then(() => true)
        .catch(err => {
            logger.error('error terminating worker pool', err);
            return false;
        });

export const runPipeline = async (params: Params): Promise<Data> => {
    return pool.queue((runPipeline) => runPipeline(params));
}