import { combineLatest, interval, Subject } from 'rxjs';
import { Params } from '.';
import { audioStream } from '../audio';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { Audio } from '../audio/types';
import { inf } from '../constants';
import { Simplifier } from '../pipe/simplifier';
import { fps } from '../web/constants';
import { error } from '../web/error';
import { inputs } from '../web/inputs';
import { extentStream } from '../web/renderer';
import { Scope } from './scope';

const subject = new Subject<Params>();
export const paramsStream = subject.asObservable();

(async () => {
  let count = 0;

  const emit = async (audio: Audio, extent: [number, number, number]) => {
    try {
      const simplifier = new Simplifier({
        theta: inputs.theta.value
      });
      const pipe = simplifier.simplify(inputs.pipe.value);
      const scope: Scope = {
        t: count++ / fps,
        inf,
        n: pipe.n,
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

  await emit(AUDIO_PLACEHOLDER, [0, 0, 0]);

  const maybeEmit = async (audio: Audio, extent: [number, number, number]) => {
    if (inputs.animate.value) {
      await emit(audio, extent);
    }
  };

  combineLatest(audioStream, extentStream, interval(1000 / fps)).subscribe(
    ([a, e]) => maybeEmit(a, e),
    error
  );
})();
