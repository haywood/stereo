import { chromaCount, binCount, octaveCount } from './constants';
import assert from 'assert';
import { Spectrum } from './spectrum';

class Processor extends AudioWorkletProcessor {
    private readonly spectrum = new Spectrum();

    process(inputs: Float32Array[][], outputs: Float32Array[][]) {
        inputs.forEach((channels, i) => {
            assert.equal(channels.length, 1, `Expected input ${i} to have exactly 1 channel, not ${channels.length}`);
        });

        const frames = inputs.map(channels => channels[0]);
        const powers = this.spectrum.process(frames);
        const power = powers.reduce((t, p) => t + p, 0) / powers.length;
        const chroma = this.chroma(powers);

        this.port.postMessage({ power, chroma });

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
    chroma = (powers: number[]) => {
        const k = argmax(powers);
        const chroma = Spectrum.chroma(k);
        const octave = Spectrum.chroma(k);
        const chromaStep = 1 / chromaCount;
        const octaveStep = chromaStep / octaveCount;
        return chroma * chromaStep + octave * octaveStep;
    };
}

const argmax = (x: ArrayLike<number>) => {
    let arg = -1, max = -Infinity;
    for (let i = 0; i < x.length; i++) {
        if (x[i] > max) {
            max = x[i];
            arg = i;
        }
    }
    return arg;
};

registerProcessor('power', Processor);
