import assert from 'assert';

import { mean } from '../reducable';
import { Band } from './band';
import { Audio } from './types';

class Processor extends AudioWorkletProcessor {
  private readonly history = new Array<Float32Array>(Band.spectrum.length);

  process(inputs: Float32Array[][]) {
    inputs = inputs.filter(channels => channels.length > 0);
    inputs.forEach((channels, i) => {
      assert.equal(
        channels.length,
        1,
        `Expected input ${i} to have exactly 1 channel, not ${channels.length}`
      );
    });

    const quanta = inputs.map(channels => channels[0]);
    const spectrogram = Band.spectrum.map((b, k) =>
      b.power(new Float32Array([...quanta[k], ...(this.history[k] ?? [])]))
    );
    quanta.forEach((q, k) => (this.history[k] = quanta[k]));
    const [low, mid, high] = spectrogram;
    const full = mean(spectrogram);

    this.port.postMessage({ enabled: true, low, mid, high, full } as Audio);

    return true;
  }
}

registerProcessor('power', Processor);
