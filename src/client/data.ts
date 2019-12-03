import { webSocket } from "rxjs/webSocket";
import {Observable, Subscriber} from 'rxjs';
import {ajax} from 'rxjs/ajax';
import {concatMap, map, catchError, repeat, retry} from 'rxjs/operators';
import {t} from './t';
import {n, rate, animate} from './query';

function getData() {
  return fetch(`/data?n=${n}&t=${t()}&rate=${rate}`)
    .then(r => r.json())
    .catch(err => {
      console.error(err);
      throw err;
    });
}

export interface Data {
  data: number[][];
  position: number[];
}

// todo: backoff for retries; rxjs does not provide :(
const pipe = (o) => animate ? o.pipe(retry(), repeat()) : o;
const fps = 1000 / 60;

export const streamData2 = () =>
  pipe(Observable.create((subscriber) => {
    const subject = webSocket("wss://localhost:8000");
  
    subject.next({n, t: t(), rate})
    let tr = t();
    subject.subscribe(
       msg => {
         subscriber.next(msg);
         // request a bit more frequently than desired fps
         // to mitigate stuttering
         const delay = 0.8 * fps - t() - tr;
         setTimeout(() => subject.next({n, t: t(), rate}), delay);
       },
       err => console.error(err),
       () => console.log('data stream closed'));
  }));


export const streamData = () =>
  pipe(Observable.create((subscriber) => {
    getData().then(data => {
      subscriber.next(data);
      subscriber.complete();
    });
  }));
