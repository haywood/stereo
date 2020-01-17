import { combineLatest, interval, Subject } from 'rxjs';
import { audioStream } from '../../audio';
import { AUDIO_PLACEHOLDER } from '../../audio/constants';
import { Audio } from '../../audio/types';
import { inf } from '../../constants';
import { Simplifier } from '../../pipe/simplifier';
import { Params, Scope } from '../../pipe/types';
import { fps } from '../constants';
import { error } from '../error';
import { inputs } from '../inputs';
import { extentStream } from '../renderer';

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
        ...audio
      };
      const params = {
        pipe,
        scope,
        hv: {
          h: inputs.h.value,
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
