import { Subject, combineLatest, interval } from 'rxjs';

import { inf } from '../../constants';
import { Simplifier } from '../../pipe/simplifier';
import { Params, Scope } from '../../pipe/types';
import { audioStream } from '../audio';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { Audio } from '../audio/types';
import { fps } from '../constants';
import { error } from '../error';
import { inputs } from '../inputs';
import { Options } from './options';

const subject = new Subject<Params>();
export const paramsStream = subject.asObservable();

(async () => {
  const params = (options: Options) => {
    const simplifier = new Simplifier({
      theta: options.theta
    });
    const pipe = simplifier.simplify(options.pipe);
    const scope: Scope = { t: options.t, inf, n: pipe.n, ...options.audio };
    return {
      pipe,
      scope,
      hv: {
        h: options.h,
        v: options.v
      }
    };
  };

  let count = 0;

  const emit = async (audio: Audio) => {
    try {
      subject.next(
        params({
          pipe: inputs.pipe.value,
          theta: inputs.theta.value,
          audio,
          h: inputs.h.value,
          v: inputs.v.value,
          t: count++ / fps
        })
      );
    } catch (err) {
      error(err);
    }
  };

  await emit(AUDIO_PLACEHOLDER);

  const maybeEmit = async (audio: Audio) => {
    if (inputs.animate.value) {
      await emit(audio);
    }
  };

  combineLatest(audioStream, interval(1000 / fps)).subscribe(
    ([a]) => maybeEmit(a),
    error
  );
})();
