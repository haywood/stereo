import {Observable} from 'rxjs';
import {ajax} from 'rxjs/ajax';
import {concatMap, map, catchError, repeat} from 'rxjs/operators';
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

const pipe = (o) => animate ? o.pipe(repeat()) : o;

export const streamData = () =>
  pipe(Observable.create((subscriber) => {
    getData().then(data => {
      subscriber.next(data);
      subscriber.complete();
    });
  }));
