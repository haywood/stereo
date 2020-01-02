import { audioStream } from './audio';
import { Params } from '../core/pipe/types';
import { interval, BehaviorSubject } from 'rxjs';
import { inputs } from './inputs';
import { fps } from './constants';
import { Audio } from './audio/types';
import { error } from './error';
import { NO_AUDIO } from './audio/constants';

const params = (t: number, { power, chroma }: Audio) => {
    return {
        pipe: inputs.pipe.value,
        theta: inputs.theta.value,
        h: inputs.h.value,
        v: inputs.v.value,
        t,
        power,
        chroma,
    };
};

const subject = new BehaviorSubject<Params>(params(0, NO_AUDIO));
export const paramsStream = subject.asObservable();
let count = 0;

let audio: Audio;
audioStream.subscribe(a => audio = a, error);

const maybeEmit = () => {
    if (inputs.animate.value) {
        subject.next(params(count++ / fps, audio));
    }
};

interval(1000 / fps).subscribe(maybeEmit, error);
