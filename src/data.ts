import { Subject } from 'rxjs';

import debug from './debug';
import { error } from './error';
import { inputs } from './inputs';
import { TextInput } from './inputs/text';
import { Params } from './params';
import * as params from './params/stream';
import { runPipeline } from './pipe/pool';
import { DataChunk } from './types';

const subject = new Subject<DataChunk>();

export const dataStream = subject.asObservable();

type Source = {
  getData(params: Params): ReturnType<typeof runPipeline>;
};

const webWorkerSource = async (): Promise<Source> => {
  return { getData: (params: Params) => runPipeline(params, subject) };
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
        await inFlight;
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
