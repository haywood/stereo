import assert from 'assert';

import {binCount, chromaCount, frameSize, octaveCount} from './constants';
import {Note} from './note';
import {Spectrum} from './spectrum';
import {Audio} from './types';

class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{name: 'dbMin', maxValue: 0}, {name: 'dbMax', maxValue: 0}];
  }

  private readonly notes = new Array(binCount);

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
    let power = 0, kMax = -1, powerMax = -Infinity, onsets = 0;
    this.notes.forEach((n, k) => {
      n.dbMin = dbMin;
      n.dbMax = dbMax;
      const analysis = n.analyze(frames[k]);
      power += analysis.power;
      onsets += analysis.onset;
      if (analysis.power > powerMax) {
        powerMax = analysis.power;
        kMax = k;
      }
    });
    power /= binCount;
    const chroma = this.chroma(kMax);
    const onset = onsets > 4 ? 1 : 0;

    assert(0 <= power && power <= 1, `power: Expected 0 <= ${power} <= 1`);
    assert(0 <= chroma && chroma <= 1, `chroma: Expected 0 <= ${chroma} <= 1`);

    this.port.postMessage({power, chroma, onset} as Audio);

    return true;
  };

  /**
   * Find the index of the maximal power and map it into color
   * space ([0, 1]) by sending it to a segment of the interval
   * based on its chroma, and then offsetting it based on its octave.
   * Notes with the same chroma go to the same color region, and go
   * further into that region the higher their octave.
   *
   * TODO: really would like to base color on a more wholistic picture
   * of the audio. Probably some kind of rolling average instead of
   * per-frame max power.
   */
  chroma = (k: number) => {
    const chroma = Spectrum.chroma(k);
    const octave = Spectrum.octave(k);
    const chromaStep = 1 / chromaCount;
    const octaveStep = chromaStep / octaveCount;
    return chroma * chromaStep + octave * octaveStep;
  };
}

registerProcessor('power', Processor);
