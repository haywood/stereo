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
    color: string;
    r: string;
    g: string;
    b: string;
}

let pipeline: Pipeline;

const needNewPipeline = (nSpec: string, seedSpec: string) => {
    return pipeline == null || pipeline.nSpec !== nSpec || pipeline.seedSpec !== seedSpec
};

const runPipeline = async (params: Params) => {
    const nSpec: string = params.n || '4096';
    const t = parseFloat(params.t) || 0;
    const rate = parseFloat(params.rate) || Math.PI / 180;
    const f0 = params.f0 || 'cos(phi)';
    const f1 = params.f1 || 'cos(phi)';
    const seedSpec = params.seed || '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)';
    const alpha = 1_000_000
    const r = params.r || `tanh(${alpha} * i) * abs(sin(t))`;
    const g = params.g || `tanh(${alpha} * i + pi/4) * abs(sin(t + pi/4))`;
    const b = params.b || `tanh(${alpha} * i + pi/2) * abs(sin(t + pi/2))`;

    if (needNewPipeline(nSpec, seedSpec)) {
        console.info('creating new pipeline for params', params);
        pipeline = new Pipeline(nSpec, seedSpec);
    }

    return pipeline.run(t, rate, f0, f1, { r, g, b });
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