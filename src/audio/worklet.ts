import assert from 'assert';
import { binCount } from './constants';
import { Note } from './note';
import { Audio } from './types';

class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'dbMin', maxValue: 0 },
      { name: 'dbMax', maxValue: 0 }
    ];
  }

  private readonly notes = Array.from({length: binCount}).map(() => new Note());

  process(
    inputs: Float32Array[][],
    _: Float32Array[][],
    parameters: PowerWorkletParams
  ) {
    inputs.forEach((channels, i) => {
      assert.equal(
        channels.length,
        1,
        `Expected input ${i} to have exactly 1 channel, not ${channels.length}`
      );
    });

    const quanta = inputs.map(channels => channels[0]);
    const dbMin = parameters.dbMin[0];
    const dbMax = parameters.dbMax[0];
    this.notes.forEach((n, k) => {
      n.dbMin = dbMin;
      n.dbMax = dbMax;
    });
    const analyses = this.notes.map((n, k) => n.analyze(quanta[k]));

    const power =
      analyses.reduce((sum, { power }) => sum + power, 0) / binCount;

    this.port.postMessage({ enabled: true, power } as Audio);

    return true;
  }
}

registerProcessor('power', Processor);
