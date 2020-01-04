import { Subject } from 'rxjs';
import { Audio } from './types';
import { Spectrum } from './spectrum';
import { binCount } from './constants';
import processorUrl from './power.worklet';
import { error } from '../error';
import { inputs } from '../inputs';

export class AudioGraph {
  static create = async (mediaStream: MediaStream, subject: Subject<Audio>) => {
    const ctx = new AudioContext();
    await ctx.audioWorklet.addModule(processorUrl);
    const source = new MediaStreamAudioSourceNode(ctx, { mediaStream });
    return new AudioGraph(ctx, source, subject);
  };

  constructor(
    private readonly ctx: AudioContext,
    source: AudioNode,
    subject: Subject<Audio>,
  ) {
    const power = new AudioWorkletNode(ctx, 'power', {
      numberOfInputs: binCount,
      channelCountMode: 'explicit',
      channelCount: 1,
    });
    power.port.onmessage = msg => subject.next(msg.data as Audio);
    power.onprocessorerror = err => {
      error(err);
      // processor dies after an error, so close the graph
      inputs.mic.value = false;
    };
    power.connect(ctx.destination);
    inputs.allowedDbs.stream.subscribe(({ newValue: [min, max] }) => {
      power.parameters.get('dbMin').setValueAtTime(min, ctx.currentTime);
      power.parameters.get('dbMax').setValueAtTime(max, ctx.currentTime);
    });

    for (let k = 0; k < binCount; k++) {
      const f = Spectrum.f(k);
      const filter = new BiquadFilterNode(ctx, {
        type: 'bandpass',
        frequency: f,
        Q: f / 2,
      });
      source.connect(filter).connect(power, 0, k);
    }
  }

  close = () => this.ctx.close();
}
