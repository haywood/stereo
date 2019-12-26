import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, interval } from 'rxjs';
import { values } from './inputs';
import { Music } from './mic/types';
import { fps } from './constants';

const subject = new Subject<Params>();
export const stream = subject;
let t = 0;

let music: Music;
mic.stream.subscribe(
    m => music = m,
    err => subject.error(err),
);

const emit = () => {
    const { eaudio, daudio } = music;
    stream.next({
        pipe: values.pipe,
        theta: values.theta,
        h: values.h,
        l: values.l,
        t,
        eaudio: eaudio,
        daudio: daudio,
    });
    t += 1 / fps;
};

interval(1000 / fps).subscribe(
    () => values.animate && emit(),
    err => subject.error(err),
);
