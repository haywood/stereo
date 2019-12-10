import { Pipeline } from './pipeline';
import { getLogger, setDefaultLevel } from 'loglevel';
import { worker } from '@arrows/worker';

setDefaultLevel('info');
const logger = getLogger('Worker');

type Params = {
    n: string;
    t: string;
    rate: string;
    f0: string;
    f1: string;
    seed: string;
    color: string;
    h: string;
    l: string;
    pipe: string;
}

let pipeline: Pipeline;

const needNewPipeline = (nSpec: string, seedSpec: string) => {
    return pipeline == null || pipeline.nSpec !== nSpec || pipeline.seedSpec !== seedSpec
};

const runPipeline = (params: Params) => {
    const nSpec: string = params.n || '4096';
    const t = parseFloat(params.t) || 0;
    const rate = parseFloat(params.rate) || Math.PI / 180;
    const f0 = params.f0 || 'cos(phi)';
    const f1 = params.f1 || 'sin(phi)';
    const seedSpec = params.seed || '2->sphere(1)->spiral(1, 1)->torus(1, 0.25)';
    const pipeSpec = params.pipe || 'R(rate * t, 0, 1)->R(rate * t, 0, 2)->R(rate * t, 0, 3)->stereo(3)'
    const hueSpec = params.h || 'abs(sin(t))*i/n';
    const lightnessSpec = params.l || '0.2 + 0.6 * (1 + abs(sin(tau * t / 60))) / 2';

    if (needNewPipeline(nSpec, seedSpec)) {
        logger.info('creating new pipeline for params', params);
        pipeline = new Pipeline(nSpec, seedSpec);
    }

    return pipeline.run(t, rate, f0, f1, hueSpec, lightnessSpec, pipeSpec);
};

export default worker(runPipeline, { poolSize: 2 });