import { Subject, combineLatest, interval } from 'rxjs';
import { FunctionThread, Worker, spawn } from 'threads';

import { Params } from '../../pipe/types';
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
  const params: FunctionThread<[Options], Params> = await spawn(
    new Worker('./worker', { name: 'params' })
  );

  let count = 0;

  const emit = async (audio: Audio) => {
    try {
      subject.next(
        await params({
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
