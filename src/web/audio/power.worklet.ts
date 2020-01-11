import assert from 'assert';

import { binCount, chromaCount, quantumSize } from './constants';
import { Note } from './note';
import { Spectrum } from './spectrum';
import { Audio } from './types';
import CircularBuffer from 'circular-buffer';
import { mean, median } from './reducable';

export default ''; // makes tsc happy
let lastTime = 0;

class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'dbMin', maxValue: 0 },
      { name: 'dbMax', maxValue: 0 }
    ];
  }

  private readonly notes = new Array<Note>(binCount);
  // track two seconds worth of onsets to determine tempo
  private readonly impulses = new CircularBuffer<number>(
    (2 * sampleRate) / quantumSize
  );
  private readonly onsets = new CircularBuffer<0 | 1>(this.impulses.capacity());

  constructor(options) {
    super(options);

    for (let i = 0; i < binCount; i++) {
      this.notes[i] = new Note();
    }
  }

  process(
    inputs: Float32Array[][],
    _: Float32Array[][],
    parameters: PowerWorkletParams
  ) {
    const start = Date.now();
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
    assert(0 <= power && power <= 1, `power: Expected 0 <= ${power} <= 1`);

    const chroma = this.chroma(analyses.map(a => a.power));
    assert(0 <= chroma && chroma <= 1, `chroma: Expected 0 <= ${chroma} <= 1`);

    const onset = this.onset(analyses.map(a => a.dpower));
    this.onsets.push(onset);
    const tempo =
      this.onsets.toarray().reduce((sum, o) => sum + o, 0) /
      this.onsets.capacity();

    this.port.postMessage({ power, chroma, tempo, onset } as Audio);
    const end = Date.now();
    if (lastTime) {
      console.debug(
        `audio processor took ${end -
          start}ms; latency between calls was ${start - lastTime}ms`
      );
    }
    lastTime = start;

    return true;
  }

  /**
   * Compute a chroma for the quantum based on a power-weighted
   * average across all the notes.
   */
  chroma = (powers: number[]) => {
    return (
      powers.reduce((sum, p, k) => {
        const chroma = Spectrum.chroma(k);

        return sum + (p * chroma) / (chromaCount - 1);
      }) / powers.length
    );
  };

  onset = (dpowers: number[]): 0 | 1 => {
    const impulse = dpowers.reduce((sum, x) => sum + x, 0);
    const impulses = this.impulses.toarray().sort((a, b) => a - b);
    this.impulses.push(impulse);

    const impmedian = median(impulses);
    const impmean = mean(impulses);

    return impulse > 0.5 * impmedian + 0.5 * impmean ? 1 : 0;
  };
}

registerProcessor('power', Processor);
