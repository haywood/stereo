import { ReplaySubject, combineLatest, interval } from 'rxjs';

import { audioStream } from '../audio';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { Audio } from '../audio/types';
import { inf } from '../constants';
import { error } from '../error';
import { inputs } from '../inputs';
import { Simplifier } from '../pipe/simplifier';
import { Scope } from './scope';
import { Params } from '.';

const fps = 60;
const subject = new ReplaySubject<Params>();
export const paramsStream = subject.asObservable();

(async () => {
  let count = 0;

  const emit = (audio: Audio) => {
    try {
      const simplifier = new Simplifier({
        theta: inputs.theta.value
      });
      const pipe = simplifier.simplify(inputs.pipe.value);
      const scope: Scope = {
        t: count++ / fps,
        inf,
        audio
      };
      const params: Params = {
        pipe,
        scope,
        hsv: {
          h: inputs.h.value,
          s: inputs.s.value,
          v: inputs.v.value
        }
      };
      subject.next(params);
    } catch (err) {
      error(err);
    }
  };

  const maybeEmit = async (audio: Audio) => {
    if (inputs.animate.value) {
      emit(audio);
    }
  };

  const inputStreams = [
    inputs.theta,
    inputs.pipe,
    inputs.h,
    inputs.s,
    inputs.v
  ].map(input => input.stream);

  combineLatest(audioStream, ...inputStreams).subscribe(
    ([a, e]) => maybeEmit(a, e),
    error
  );
})();
