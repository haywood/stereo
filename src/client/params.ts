import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, combineLatest, interval } from 'rxjs';
import { inputs } from './inputs';

export const stream = new Subject<Params>();
const fps = 60;

combineLatest(mic.stream, interval(fps / 1000))
    .subscribe(([{ esong, beat }]: [mic.Music, number]) => {
        stream.next({
            pipe: inputs.pipe,
            theta: inputs.theta,
            h: inputs.h,
            l: inputs.l,
            t: Date.now(),
            bpm: beat.bpm,
            ebeat: beat.e,
            esong: esong,
        });
    });
