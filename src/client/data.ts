import { Observable, timer, Subject, interval, EMPTY } from 'rxjs';
import { retryWhen, delayWhen, repeatWhen, tap } from 'rxjs/operators';
import { Data } from '../core/data';
import { t } from './t';
import { q, streams } from './query';
import { Params } from "../core/pipeline/pipeline";
import { startPool, stopPool, runPipeline } from '../core/pipeline/pool';
import { spawn, Thread, Worker } from "threads"

const second = 1000;
let retryCount = 0;


const params: Observable<Params> = Observable.create((s) => {
  s.next({ t: t(), ...q });
  s.complete();
});

type Source = {
  subject: Subject<Data>;
  requestData(params: Params): void;
  close(): void;
}

const webSocketSource = async (): Promise<Source> => {
  const socket = new WebSocket("ws://localhost:8000");
  return new Promise((resolve, reject) => {
    socket.onerror = (ev: ErrorEvent) => reject(ev.error);
    socket.onclose = (event) => reject(event);

    socket.onopen = () => {
      console.info('starting web socket data source');
      const requestData =
        (params: Params) => socket.send(JSON.stringify(params));
      const subject = new Subject<Data>();
      const close = () => socket.close();

      socket.onmessage =
        (ev: MessageEvent) => subject.next(JSON.parse(ev.data) as Data);

      socket.onerror = (ev: ErrorEvent) => subject.error(ev);

      socket.onclose =
        (ev: CloseEvent) =>
          ev.wasClean ? subject.complete() : subject.error(ev);

      resolve({ subject, requestData, close });
    }
  });
}

const webWorkerSource = async (): Promise<Source> => {
  console.info('starting web worker data source');
  const subject = new Subject<Data>();
  startPool(2);

  const requestData = (params: Params) =>
    runPipeline(params)
      .then(data => subject.next(data))
      .catch(err => subject.error(err));

  const close = stopPool;

  return { subject, requestData, close };
}

let source;
const startStream = async () => {
  source = await (q.remote ? webSocketSource() : webWorkerSource());
  const { subject, requestData } = source;
  const pacer = interval(second / 60);

  params
    .pipe(
      repeatWhen(() => q.animate ? subject : EMPTY),
      delayWhen(() => pacer)
    )
    .subscribe(requestData);

  subject
    .pipe(
      tap(() => {
        retryCount = 0; // reset retries after a successful receipt
      }),
      retryWhen(errors =>
        errors.pipe(
          delayWhen((err) => {
            const delay = second * 2 ** retryCount++;
            console.error('data stream emmitted error', err);
            console.error(`waiting ${delay}ms to retry after error # ${retryCount}`);
            return timer(delay);
          })
        )))
    .subscribe((data: Data) => outer.next(data));
}

startStream();

const resetStreamOnChange = ({ newValue, oldValue }) => {
  if (newValue !== oldValue) {
    source.close();
    source.subject.complete();
    startStream();
  }
};

streams.animate.subscribe(resetStreamOnChange);
streams.remote.subscribe(resetStreamOnChange);

let outer = new Subject<Data>();

export const stream = outer.asObservable();