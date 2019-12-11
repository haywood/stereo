import { Observable, timer, Subject, empty } from 'rxjs';
import { retryWhen, delayWhen, repeatWhen, tap, delay } from 'rxjs/operators';
import { Data } from '../core/data';
import { t } from './t';
import { q, streams } from './query';
import PipelineWorker from 'worker-loader!./pipeline.worker';
import { Params } from "../core/pipeline";

const second = 1000;
const fps = second / 60;
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

const webSocketSource = (): Source => {
  console.info('starting web socket data source');
  const requestData = (params: Params) => socket.send(JSON.stringify(params));
  const socket = new WebSocket("ws://localhost:8000");
  const subject = new Subject<Data>();
  const close = () => socket.close();

  socket.onmessage = (ev: MessageEvent) => subject.next(JSON.parse(ev.data) as Data);
  socket.onerror = (ev: ErrorEvent) => subject.error(ev.error);
  socket.onclose = () => subject.complete();

  return { subject, requestData, close };
}

const webWorkerSource = (): Source => {
  console.info('starting web worker data source');
  const requestData = (params: Params) => worker.postMessage(params);
  const worker = new PipelineWorker();
  const subject = new Subject<Data>();
  const close = () => worker.terminate();

  worker.onmessage = (ev: MessageEvent) => subject.next(ev.data as Data);
  worker.onerror = (ev: ErrorEvent) => subject.error(ev.error);

  return { subject, requestData, close };
}

let source;
const startStream = () => {
  source = q.remote ? webSocketSource() : webWorkerSource();
  const { subject, requestData } = source;

  params
    .pipe(
      repeatWhen(() => q.animate ? subject : empty()),
      delay(fps)
    )
    .subscribe(requestData);

  return subject
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
    .subscribe(data => outer.next(data));
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