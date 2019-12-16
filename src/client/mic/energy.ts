import assert from 'assert';
import { getLogger } from 'loglevel';

const logger = getLogger('Energy');

export class Energy {
    constructor(private readonly bandCount: number) { }

    compute = (freqs: Uint8Array) => {
        assert.equal(freqs.length % this.bandCount, 0,
            `freqs has length ${freqs.length}, which is not divided by ${this.bandCount}`);
        logger.debug(`computing energies for ${freqs}`);

        const bandSize = freqs.length / this.bandCount;
        const energies = new Array(this.bandCount).fill(0);
        for (let i = 0; i < this.bandCount; i++) {
            const offset = i * bandSize;
            for (let j = offset; j < offset + bandSize; j++) {
                const x = freqs[j];
                energies[i] += x * x;
            }
        }
        logger.debug(`computed energies: ${energies}`);
        return energies;
    };
}
