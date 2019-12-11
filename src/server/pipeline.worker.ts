import { runPipeline } from '../core/pipeline';
import { worker } from '@arrows/worker';

export default worker(runPipeline, { poolSize: 2 });