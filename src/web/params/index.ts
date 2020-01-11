import { audioStream } from '../audio';
import { Params } from '../../core/pipe/types';
import { interval, combineLatest, Subject } from 'rxjs';
import { inputs } from '../inputs';
import { fps } from '../constants';
import { Audio } from '../audio/types';
import { error } from '../error';
import { AUDIO_PLACEHOLDER } from '../audio/constants';
import { spawn, FunctionThread, Worker } from 'threads';
import { Options } from './options';

const subject = new Subject<Params>();
export const paramsStream = subject.asObservable();

(async () => {
  const params: FunctionThread<[Options], Params> = await spawn(
    new Worker('./worker', { name: 'params' }),
  );

  const emit = async (t: number, audio: Audio) => {
    try {
      subject.next(
        await params({
          pipe: inputs.pipe.value,
          theta: inputs.theta.value,
          audio,
          h: inputs.h.value,
          v: inputs.v.value,
          t,
        }),
      );
    } catch (err) {
      error(err);
    }
  };

  let count = 0;

  const maybeEmit = async (audio: Audio) => {
    if (inputs.animate.value) {
      await emit(count++ / fps, audio);
    }
  };

  await maybeEmit(AUDIO_PLACEHOLDER);

  combineLatest(audioStream, interval(1000 / fps)).subscribe(
    ([a]) => maybeEmit(a),
    error,
  );
})();
