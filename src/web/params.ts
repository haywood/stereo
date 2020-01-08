import { audioStream } from './audio';
import { Params } from '../core/pipe/types';
import { interval, BehaviorSubject, combineLatest } from 'rxjs';
import { inputs } from './inputs';
import { fps } from './constants';
import { Audio } from './audio/types';
import { error } from './error';
import { AUDIO_PLACEHOLDER } from './audio/constants';

const params = (t: number, audio: Audio) => {
  return {
    pipe: inputs.pipe.value,
    theta: inputs.theta.value,
    h: inputs.h.value,
    v: inputs.v.value,
    t,
    ...audio,
  };
};

const subject = new BehaviorSubject<Params>(params(0, AUDIO_PLACEHOLDER));
export const paramsStream = subject.asObservable();
let count = 0;

const maybeEmit = ([audio]: [Audio, number]) => {
  if (inputs.animate.value) {
    subject.next(params(count++ / fps, audio));
  }
};

combineLatest(audioStream, interval(1000 / fps)).subscribe(maybeEmit, error);
