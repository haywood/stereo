import { ReplaySubject, combineLatest, interval } from 'rxjs';
import { pp } from '../pp';

import { audioStream } from '../audio';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { Audio } from '../audio/types';
import { inf } from '../constants';
import { error } from '../error';
import { inputs } from '../inputs';
import { Simplifier } from '../pipe/simplifier';
import { Scope } from './scope';
import { Params } from '.';

const subject = new ReplaySubject<Params>();
export const paramsStream = subject.asObservable();

let count = 0;

const emit = (audio: Audio) => {
  try {
    const simplifier = new Simplifier({
      theta: inputs.theta.value
    });
    const params: Params = {
      pipe: simplifier.simplify(inputs.pipe.value),
      scope: { audio },
      hsv: {
        h: inputs.h.value,
        s: inputs.s.value,
        v: inputs.v.value
      }
    };
    console.debug(`emitting params ${pp(params)}`);
    subject.next(params);
  } catch (err) {
    error(err);
  }
};

const inputStreams = [
  inputs.theta,
  inputs.pipe,
  inputs.h,
  inputs.s,
  inputs.v
].map(input => input.stream);

combineLatest(audioStream, ...inputStreams).subscribe(([a]) => emit(a), error);
