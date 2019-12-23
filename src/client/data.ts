import { Observable, timer, Subject, interval, EMPTY } from 'rxjs';
import { retryWhen, delayWhen, repeatWhen, tap } from 'rxjs/operators';
import { Data } from '../core/data';
import { Params } from "../core/pipe/types";
import { startPool, stopPool, runPipeline } from '../core/pipe/pool';
import * as params from './params';
import { getLogger } from 'loglevel';
import { pp } from '../core/pp';

const logger = getLogger('Data');
const subject = new Subject<Data>();
let logged = 0;

const timeTooLong = () => Date.now() - logged >= 1000;

export const data = subject.asObservable();

type Source = {
  getData(params: Params): Promise<Data>;
};

const webWorkerSource = (): Source => {
  console.info('starting web worker data source');
  startPool(navigator.hardwareConcurrency);

  const getData = (params: Params) =>
    runPipeline(params).then(Data.fromBuffer);

  return { getData };
};

let inFlight: Promise<void> | null;

const { getData } = webWorkerSource();
params.stream.subscribe(params => {
  if (inFlight) return;
  logger.debug('requesting data with params', params);
  if (timeTooLong()) {
    logger.info(`sending request for data with params ${pp(params)}`);
    logged = Date.now();
  }
  inFlight = getData(params)
    .then(data => subject.next(data))
    .finally(() => {
      inFlight = null;
    });
});
