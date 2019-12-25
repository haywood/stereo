import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, interval } from 'rxjs';
import { values } from './inputs';
import { Music } from './mic/types';
import { fps } from './constants';

export const stream = new Subject<Params>();
let t = 0;

let music: Music;
mic.stream.subscribe(m => music = m);

const emit = () => {
    const { esong, dsong } = music;
    stream.next({
        pipe: values.pipe,
        theta: values.theta,
        h: values.h,
        l: values.l,
        t,
        esong: esong,
        dsong: dsong,
    });
    t += 1 / fps;
};

interval(1000 / fps).subscribe(() => values.animate && emit());
