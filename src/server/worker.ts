import { Pipeline } from './pipeline';
import { parentPort } from 'worker_threads';
import * as math from 'mathjs';
import * as fn from './fn';

type Params = {
    n: string;
    t: string;
    rate: string;
    f0: string;
    f1: string;
    seed: string;
}

let pipeline;

const needNewPipeline =
    (n: number, seed: string) => pipeline == null || pipeline.n !== n || pipeline.seedSpec !== seed;

const runPipeline = async (params: Params) => {
    const n = parseInt(params.n) || 4096;
    const t = parseFloat(params.t) || 0;
    const rate = parseFloat(params.rate) || Math.PI / 180;
    const f0 = params.f0 || 'cos(phi)';
    const f1 = params.f1 || 'cos(phi)';
    const seed = params.seed || '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)';

    if (needNewPipeline(n, seed)) {
        console.info('creating new pipeline for params', params);
        pipeline = new Pipeline(n, seed);
    }

    return pipeline.run(t, rate, f0, f1);
};

parentPort.on('message', async (msg) => {
    if (msg === 'exit') {
        process.exit(0);
    } else {
        let data;
        try {
            data = await runPipeline(msg);
        } catch (err) {
            console.error(`error running pipeline on message ${JSON.stringify(msg, null, 2)}`, err);
            data = { err };
        }
        parentPort.postMessage(data);
    }
});