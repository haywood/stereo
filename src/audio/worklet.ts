import assert from 'assert';
import CircularBuffer from 'circular-buffer';
import { argmax, mean, median, sum } from '../reducable';
import { binCount, chromaCount, octaveCount, quantumSize } from './constants';
import { Note } from './note';
import { Spectrum } from './spectrum';
import { Audio } from './types';

const onsetWindowSecs = 1;
const onsetWindowSize = Math.round(
  (onsetWindowSecs * sampleRate) / quantumSize
);
const bpmMax = 200;
const tempoModulus = ((onsetWindowSize / onsetWindowSecs) * bpmMax) / 60;

class Processor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'dbMin', maxValue: 0 },
      { name: 'dbMax', maxValue: 0 }
    ];
  }

  private readonly notes = new Array<Note>(binCount);
  // track 1 seconds worth of onsets to determine tempo
  private readonly impulses = new CircularBuffer<number>(onsetWindowSize);
  private readonly onsets = new CircularBuffer<0 | 1>(onsetWindowSize);

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
    const beatCount = this.onsets.toarray().reduce((sum, o) => sum + o, 0);
    const tempo = Math.min(1, beatCount / tempoModulus);

    this.port.postMessage({ power, chroma, tempo, onset } as Audio);

    return true;
  }

  /**
   * Compute a chroma for the quantum based on the loudest note.
   */
  chroma = (powers: number[]) => {
    const k = argmax(powers);
    const chromaStep = 1 / chromaCount; // partition [0, 1] into chroma regions
    const octaveStep = chromaStep / octaveCount; // partition [0, chromaStep] into octave regions
    const chroma = Spectrum.chroma(k);
    const octave = Spectrum.octave(k);
    return chroma * chromaStep + octave * octaveStep;
  };

  onset = (dpowers: number[]): 0 | 1 => {
    const impulse = sum(dpowers);
    const impulses = this.impulses.toarray();
    this.impulses.push(impulse);

    const impmedian = median(impulses);
    const impmean = mean(impulses);

    return impulse > 0.5 * impmedian + 0.5 * impmean ? 1 : 0;
  };
}

registerProcessor('power', Processor);
