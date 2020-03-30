import { Subject } from 'rxjs';

import debug from '../debug';
import { inputs } from '../inputs';
import { AUDIO_PLACEHOLDER, binCount } from './constants';
import { Spectrum } from './spectrum';
import { Audio } from './types';

export class AudioGraph {
  static create = async (mediaStream: MediaStream, subject: Subject<Audio>) => {
    const ctx = new AudioContext();
    await ctx.audioWorklet.addModule('audio/worklet.js');
    const source = new MediaStreamAudioSourceNode(ctx, { mediaStream });
    return new AudioGraph(ctx, source, subject);
  };

  private ts = Date.now();

  constructor(
    private readonly ctx: AudioContext,
    source: AudioNode,
    subject: Subject<Audio>
  ) {
    const power = new AudioWorkletNode(ctx, 'power', {
      numberOfInputs: binCount,
      channelCountMode: 'explicit',
      channelCount: 1
    });

    power.port.onmessage = msg => {
      let latency = 0;

      if (inputs.mic.value) {
        subject.next(msg.data as Audio);

        const ts = Date.now();
        latency = ts - this.ts;
        this.ts = ts;
      } else {
        subject.next(AUDIO_PLACEHOLDER);
      }

      debug('audio_latency', latency);
    };

    power.onprocessorerror = err => {
      console.error(err);
      // processor dies after an error, so close the graph
      inputs.mic.value = false;
    };

    power.connect(ctx.destination);

    for (let k = 0; k < binCount; k++) {
      const f = Spectrum.f(k);
      const filter = new BiquadFilterNode(ctx, {
        type: 'bandpass',
        frequency: f,
        Q: f / 2
      });
      source.connect(filter).connect(power, 0, k);
    }
  }

  close = () => this.ctx.close();
}
