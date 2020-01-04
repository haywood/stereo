import assert from 'assert';

import {binCount, chromaCount, frameSize, octaveCount} from './constants';
import {Note} from './note';
import {Spectrum} from './spectrum';
import {Audio} from './types';

class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{name: 'dbMin', maxValue: 0}, {name: 'dbMax', maxValue: 0}];
  }

  private readonly notes = new Array<Note>(binCount);

  constructor(options) {
    super(options);

    for (let i = 0; i < binCount; i++) {
      this.notes[i] = new Note();
    }
  }

  process(
      inputs: Float32Array[][], _: Float32Array[][],
      parameters: PowerWorkletParams) {
    inputs.forEach((channels, i) => {
      assert.equal(
          channels.length, 1,
          `Expected input ${i} to have exactly 1 channel, not ${
              channels.length}`);
    });

    const frames = inputs.map(channels => channels[0]);
    const dbMin = parameters.dbMin[0];
    const dbMax = parameters.dbMax[0];
    this.notes.forEach((n, k) => {
      n.dbMin = dbMin;
      n.dbMax = dbMax;
    });
    const analyses = this.notes.map((n, k) => n.analyze(frames[k]));

    const power = analyses.reduce((sum, {power}) => sum + power, 0) / binCount;
    assert(0 <= power && power <= 1, `power: Expected 0 <= ${power} <= 1`);

    const chroma = this.chroma(analyses.map(a => a.power));
    assert(0 <= chroma && chroma <= 1, `chroma: Expected 0 <= ${chroma} <= 1`);

    const onset = 0;


    this.port.postMessage({power, chroma, onset} as Audio);

    return true;
  };

  /**
   * Compute a chroma for the frame based on a power-weighted
   * average across all the notes.
   */
  chroma = (powers: number[]) => {
    return powers.reduce((sum, p, k) => {
      const chroma = Spectrum.chroma(k);

      return sum + p * chroma / (chromaCount - 1);
    }) / powers.length;
  };
}

registerProcessor('power', Processor);
