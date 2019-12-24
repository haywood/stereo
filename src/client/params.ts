import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, combineLatest, interval } from 'rxjs';
import { values, streams } from './inputs';
import { Music } from './mic/types';

export const stream = new Subject<Params>();
const fps = 60;
let t = 0;

let music: Music;
mic.stream.subscribe(m => music = m);

const emit = () => {
    const { beat, esong } = music;
    stream.next({
        pipe: values.pipe,
        theta: values.theta,
        h: values.h,
        l: values.l,
        t,
        bpm: beat.bpm,
        ebeat: beat.e,
        esong: esong,
    });
    t += 1 / fps;
};

interval(1000 / fps).subscribe(() => values.animate && emit());
