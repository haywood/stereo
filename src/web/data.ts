import { Observable, timer, Subject, interval, EMPTY } from 'rxjs';
import { retryWhen, delayWhen, repeatWhen, tap } from 'rxjs/operators';
import { Data } from '../core/data';
import { Params } from '../pipe/types';
import { startPool, runPipeline } from '../pipe/pool';
import * as params from './params';
import { getLogger } from 'loglevel';
import { pp } from '../core/pp';
import { error } from './error';
import debug from './debug';

const logger = getLogger('Data');
logger.setDefaultLevel('info');
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
  let logged = 0;

  params.paramsStream.subscribe(
    async params => {
      if (inFlight) return;
      debug('params', params);
      logger.debug('requesting data with params', params);
      if (Date.now() - logged >= 1000) {
        logger.debug(`sending request for data with params ${pp(params)}`);
        logged = Date.now();
      }
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
    err => error(err),
  );
})();
