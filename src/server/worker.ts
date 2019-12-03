import {Pipeline} from './pipeline';
import {parentPort} from 'worker_threads';

type Params = {
    n: string;
    t: string;
    rate: string;
}

let pipeline;

const needNewPipeline =
    (n, rate) => pipeline == null || pipeline.n !== n || pipeline.rate !== rate;

const runPipeline = async (params: Params) => {
    const n = parseInt(params.n)  || 4096;
    const t = parseFloat(params.t) || 0;
    const rate = parseFloat(params.rate) || Math.PI / 180;

    if (needNewPipeline(n, rate)) pipeline = new Pipeline(n, rate);

    return pipeline.run(t);
};

parentPort.on('message', async (msg) => {
    parentPort.postMessage(await runPipeline(msg));
});