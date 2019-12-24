import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, combineLatest, interval } from 'rxjs';
import { inputs, streams } from './inputs';
import { Music } from './mic/types';

export const stream = new Subject<Params>();
const fps = 60;
let t = 0;

let music: Music;
mic.stream.subscribe(m => music = m);

interval(1000 / fps)
    .subscribe(() => {
        if (inputs.animate) {
            const { beat, esong } = music;
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
