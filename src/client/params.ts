import * as mic from './mic';
import { Params } from '../core/pipe/types';
import { Subject, combineLatest, interval } from 'rxjs';
import { inputs } from './inputs';
import { Beat } from './mic/beat';
import { pp } from '../core/pp';
import { abs } from 'mathjs';

export const stream = new Subject<Params>();
let lastBeat: Beat;
const fps = 60;

const bpmChanged = (beat: Beat) =>
    lastBeat && abs(beat.bpm - lastBeat.bpm) > 0.1 * abs(lastBeat.bpm);

combineLatest(mic.stream, interval(fps / 1000))
    .subscribe(([{ esong, beat }]: [mic.Music, number]) => {
        if (bpmChanged(beat)) {
            console.info(`bpm changed between ${pp(lastBeat)} and ${pp(beat)}`);
        }
        lastBeat = beat;

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
