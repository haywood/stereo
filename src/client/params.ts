import * as audio from './audio';
import { Params } from '../core/pipe/types';
import { Subject, interval } from 'rxjs';
import { values } from './inputs';
import { fps } from './constants';
import { Audio } from './audio/types';

const subject = new Subject<Params>();
export const stream = subject;
let t = 0;

let music: Audio;
audio.stream.subscribe(
    a => music = a,
    err => subject.error(err),
);

const emit = () => {
    const { power, chroma } = music;
    stream.next({
        pipe: values.pipe,
        theta: values.theta,
        h: values.h,
        l: values.l,
        t,
        power,
        chroma,
    });
    t += 1 / fps;
};

interval(1000 / fps).subscribe(
    () => values.animate && emit(),
    err => subject.error(err),
);
