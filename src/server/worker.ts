import { Pipeline, Params } from '../core/pipeline';
import { worker } from '@arrows/worker';

const pipelines = new Map<string, Pipeline>();

const runPipeline = (params: Params) => {
    const key = JSON.stringify(params);
    if (params.n) {
        if (!pipelines.has(key)) {
            pipelines.set(key, Pipeline.create(params));
        }
    }

    return pipelines.get(key).run(params);
};

export default worker(runPipeline, { poolSize: 2 });