import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, combineLatest, interval } from 'rxjs';
import { inputs } from './inputs';

export const stream = new Subject<Params>();
const fps = 60;

combineLatest(mic.stream, interval(1000 / fps))
    .subscribe(([{ esong, beat }, i]: [mic.Music, number]) => {
        stream.next({
            pipe: inputs.pipe,
            theta: inputs.theta,
            h: inputs.h,
            l: inputs.l,
            t: i / fps,
            bpm: beat.bpm,
            ebeat: beat.e,
            esong: esong,
        });
    });
