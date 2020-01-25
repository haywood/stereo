import { Subject } from 'rxjs';
import debug from './debug';
import { error } from './error';
import { inputs } from './inputs';
import { TextInput } from './inputs/text';
import { Params } from './params';
import * as params from './params/stream';
import { runPipeline, startPool } from './pipe/pool';
import { Data } from './types';

const subject = new Subject<Data>();

export const dataStream = subject.asObservable();

type Source = {
  getData(params: Params): ReturnType<typeof runPipeline>;
};

const webWorkerSource = async (): Promise<Source> => {
  await startPool();

  return { getData: (params: Params) => runPipeline(params) };
};

(async () => {
  const { getData } = await webWorkerSource();
  let inFlight: ReturnType<typeof getData> | null;

  params.paramsStream.subscribe(
    async params => {
      if (inFlight) return;
      for (const input of Object.values(inputs)) {
        if (input instanceof TextInput && !input.valid()) return;
      }
      debug('params', params);
      // TODO i feel like there's a more rx-y way to do this
      inFlight = getData(params);
      try {
        const data = await inFlight;
        subject.next(data);
      } catch (err) {
        if (['pipe', 'h', 'v'].includes(err.context)) {
          inputs[err.context].markInvalid(err, 0);
        } else {
          error(err);
        }
      } finally {
        inFlight = null;
      }
    },
    err => error(err)
  );
})();
