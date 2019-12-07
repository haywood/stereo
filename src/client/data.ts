import { webSocket } from "rxjs/webSocket";
import { Observable, timer } from 'rxjs';
import { retryWhen, delayWhen } from 'rxjs/operators';
import { t } from './t';
import * as q from './query';

const second = 1000;
const fps = second / 60;
let retryCount = 0;

export type Data = {
  position: number[];
  d: number;
}

export const streamData = (): Observable<Data> =>
  Observable.create((subscriber) => {
    const url = "wss://localhost:8000";
    console.info(`opening data stream WebSocket to ${url}`);
    const subject = webSocket(url);
    const requestData = () => subject.next({ n: q.n, t: t(), rate: q.rate, f0: q.f0, f1: q.f1, seed: q.seed });

    requestData();
    let tr = t();
    subject.subscribe(
      msg => {
        subscriber.next(msg);
        retryCount = 0; // reset retries after a successful receipt
        if (q.animate) {
          // request a bit more frequently than desired fps
          // to mitigate stuttering
          const delay = 0.8 * fps - t() - tr;
          setTimeout(requestData, delay);
        } else {
          subject.complete();
        }
      },
      err => subscriber.error(err),
      () => console.warn('data stream closed'));
  }).pipe(retryWhen(errors => errors.pipe(
    delayWhen((err) => {
      const delay = second * 2 ** retryCount++;
      console.error('data stream emmitted error', err);
      console.error(`waiting ${delay}ms to retry after error # ${retryCount}`);
      return timer(delay);
    })
  )));
