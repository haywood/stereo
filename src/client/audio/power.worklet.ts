import { chromaCount, binCount } from './constants';
import assert from 'assert';
import { Spectrum } from './spectrum';

class Processor extends AudioWorkletProcessor {
    private readonly spectrum = new Spectrum();

    constructor(options) {
        super({
            ...options,
            numberOfOutputs: binCount,
            channelCount: 1,
        });
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]) {
        inputs.forEach((channels, i) => {
            assert.equal(channels.length, 1, `Expected input ${i} to have exactly 1 channel, not ${channels.length}`);
        });

        const frames = inputs.map(channels => channels[0]);
        const powers = this.spectrum.process(frames);
        const power = powers.reduce((t, p) => t + p, 0) / powers.length;
        const chroma = Spectrum.chroma(argmax(powers)) / (chromaCount - 1);

        this.port.postMessage({ power, chroma });

        return true;
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
