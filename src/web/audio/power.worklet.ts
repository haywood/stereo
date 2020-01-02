import { chromaCount, binCount, octaveCount, frameSize } from './constants';
import assert from 'assert';
import { Spectrum } from './spectrum';
import { mean } from 'mathjs';
import CircularBuffer from 'circular-buffer';

class Processor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'dbMin', maxValue: 0 },
            { name: 'dbMax', maxValue: 0 }
        ];
    }

    private readonly history = new Array<CircularBuffer>(binCount);

    constructor(options) {
        super(options);

        // Number of frames collected per second
        const fps = sampleRate / frameSize;
        // Number of frames collected per 10ms
        const fpcs = fps / 100;

        for (let i = 0; i < binCount; i++) {
            // Create a buffer with enough room for ~10ms worth of frames
            // in order to target 10ms resolution for signal power.
            this.history[i] = new CircularBuffer(Math.floor(fpcs));
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: PowerWorkletParams) {
        inputs.forEach((channels, i) => {
            assert.equal(channels.length, 1, `Expected input ${i} to have exactly 1 channel, not ${channels.length}`);
        });

        const frames = inputs.map(channels => channels[0]);
        const { dbMin, dbMax } = parameters;
        const powers = new Spectrum(dbMin[0], dbMax[0]).process(frames);
        powers.forEach((p, i) => this.history[i].push(p));
        const power = mean(this.history.map(h => mean(h.toarray())));
        const chroma = this.chroma(powers);

        assert(0 <= power && power <= 1, `power: Expected 0 <= ${power} <= 1`);
        assert(0 <= chroma && chroma <= 1, `chroma: Expected 0 <= ${chroma} <= 1`);

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
        const octave = Spectrum.octave(k);
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
