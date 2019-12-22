import assert from 'assert';
import { getLogger } from 'loglevel';
import { ceil } from 'mathjs';

const logger = getLogger('Energy');

export class Energy {
    constructor(
        private readonly bandCount: number,
        private readonly fftSize: number,
        private readonly memory: number,
    ) { }

    bandSize = (i: number) => {
        const sumMemory = this.memory * (this.memory + 1);
        const a = this.fftSize / sumMemory;
        return ceil(a) * (i + 1);
    };

    compute = (freqs: Uint8Array): Float32Array => {
        assert.equal(freqs.length % this.bandCount, 0,
            `freqs has length ${freqs.length}, which is not divided by ${this.bandCount}`);
        logger.debug(`computing energies for ${freqs}`);

        const energies = new Float32Array(this.bandCount);
        let offset = 0;
        for (let i = 0; i < this.bandCount; i++) {
            const bandSize = this.bandSize(i);
            const limit = Math.min(offset + bandSize, freqs.length);
            for (let j = offset; j < limit; j++) {
                const x = freqs[j] / 255;
                energies[i] += x * x;
            }
            energies[i] /= bandSize;
            offset += bandSize;
        }
        logger.debug(`computed energies: ${energies}`);
        return energies;
    };
}
