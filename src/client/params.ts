import * as mic from './mic';
import { Params } from '../core/pipe/pipe';
import { Subject, combineLatest, interval } from 'rxjs';
import { inputs } from './inputs';
import { Band } from './mic';

export const stream = new Subject<Params>();
const fps = 60;

combineLatest(mic.stream, interval(fps / 1000))
    .subscribe(([band]: [Band, number]) => {
        stream.next({
            pipe: inputs.pipe,
            rate: inputs.rate,
            f0: inputs.f0,
            f1: inputs.f1,
            h: inputs.h,
            l: inputs.l,
            t: Date.now(),
            bpm: band.bpm,
            on: band.on,
        });
    });
