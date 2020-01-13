import { Subject } from 'rxjs';

import { Data } from '../data';
import { runPipeline, startPool } from '../pipe/pool';
import { Params } from '../pipe/types';
import debug from './debug';
import { error } from './error';
import * as params from './params';

const subject = new Subject<Data>();

export const dataStream = subject.asObservable();

type Source = {
  getData(params: Params): Promise<Data>;
};

const webWorkerSource = async (): Promise<Source> => {
  console.info('starting web worker data source');
  await startPool();

  const getData = (params: Params) => runPipeline(params).then(Data.fromBuffer);

  return { getData };
};

(async () => {
  const { getData } = await webWorkerSource();
  let inFlight: Promise<Data> | null;

  params.paramsStream.subscribe(
    async params => {
      if (inFlight) return;
      debug('params', params);
      // TODO i feel like there's a more rx-y way to do this
      inFlight = getData(params);
      try {
        subject.next(await inFlight);
      } catch (err) {
        error(err);
      } finally {
        inFlight = null;
      }
    },
    err => error(err)
  );
})();
