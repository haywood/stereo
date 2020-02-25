import { ReplaySubject, combineLatest, interval } from 'rxjs';

import { audioStream } from '../audio';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { Audio } from '../audio/types';
import { inf } from '../constants';
import { error } from '../error';
import { inputs } from '../inputs';
import { Simplifier } from '../pipe/simplifier';
import { extentStream } from '../renderer';
import { Scope } from './scope';
import { Params } from '.';

const fps = 60;
const subject = new ReplaySubject<Params>();
export const paramsStream = subject.asObservable();

(async () => {
  let count = 0;

  const emit = (audio: Audio, extent: [number, number, number]) => {
    try {
      const simplifier = new Simplifier({
        theta: inputs.theta.value
      });
      const pipe = simplifier.simplify(inputs.pipe.value);
      const scope: Scope = {
        t: count++ / fps,
        inf,
        extent,
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

  const maybeEmit = async (audio: Audio, extent: [number, number, number]) => {
    if (inputs.animate.value) {
      emit(audio, extent);
    }
  };

  const inputStreams = [
    inputs.theta,
    inputs.pipe,
    inputs.h,
    inputs.s,
    inputs.v
  ].map(input => input.stream);

  combineLatest(audioStream, extentStream, ...inputStreams).subscribe(
    ([a, e]) => maybeEmit(a, e),
    error
  );
})();
