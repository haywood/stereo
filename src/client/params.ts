import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, combineLatest, interval, of, EMPTY } from 'rxjs';
import { inputs, streams } from './inputs';
import { delayWhen } from 'rxjs/operators';

export const stream = new Subject<Params>();
const fps = 60;
let t = 0;

combineLatest(mic.stream, interval(1000 / fps))
    .subscribe(([{ esong, beat }]: [mic.Music, number]) => {
        if (inputs.animate) {
            stream.next({
                pipe: inputs.pipe,
                theta: inputs.theta,
                h: inputs.h,
                l: inputs.l,
                t,
                bpm: beat.bpm,
                ebeat: beat.e,
                esong: esong,
            });
            t += 1 / fps;
        }
    });
