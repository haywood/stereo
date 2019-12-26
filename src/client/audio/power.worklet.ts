import { chromaCount } from './constants';
import assert from 'assert';
import { Spectrum } from './spectrum';
import { log2 } from 'mathjs';

class Processor extends AudioWorkletProcessor {
    private readonly spectrum = new Spectrum();

    process(inputs: Float32Array[][], outputs: Float32Array[][]) {
        assert.equal(inputs.length, 1, `Expected exactly 1 input, not ${inputs.length}`);
        const channels = inputs[0];
        assert.equal(channels.length, 1, `Expected input to have exactly 1 channel, not ${channels.length}`);
        const frame = channels[0];

        this.spectrum.process(frame);

        if (this.spectrum.ready) {
            const powers = this.spectrum.getPowersAndReset();
            const power = powers.reduce((t, p) => t + p, 0) / powers.length;
            const chroma = (log2(this.spectrum.f(argmax(powers))) % chromaCount) / (chromaCount - 1);
            this.port.postMessage({ power, chroma });
        }
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
