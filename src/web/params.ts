import { audioStream } from './audio';
import { Params, Scope } from '../core/pipe/types';
import { interval, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { inputs } from './inputs';
import { fps } from './constants';
import { Audio } from './audio/types';
import { error } from './error';
import { AUDIO_PLACEHOLDER } from './audio/constants';
import { Compiler } from '../core/pipe/compiler';
import { inf } from '../core/constants';

const params = (t: number, audio: Audio) => {
  const compiler = new Compiler({ theta: inputs.theta.value });
  const pipe = compiler.compile(inputs.pipe.value);
  const scope: Scope = { t, inf, n: pipe.n, ...audio };
  return {
    pipe,
    scope,
    hv: {
      h: compiler.compile(`360 * (${inputs.h.value})`, 'scalar'),
      v: compiler.compile(`100 * (${inputs.v.value})`, 'scalar'),
    },
  };
};

const emit = (t: number, audio: Audio) => {
  try {
    subject.next(params(t, audio));
  } catch (err) {
    error(err);
  }
};

const subject = new Subject<Params>();
emit(0, AUDIO_PLACEHOLDER);
export const paramsStream = subject.asObservable();
let count = 0;

const maybeEmit = ([audio]: [Audio, number]) => {
  if (inputs.animate.value) {
    emit(count++ / fps, audio);
  }
};

combineLatest(audioStream, interval(1000 / fps)).subscribe(maybeEmit, error);
