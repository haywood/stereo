import { getLogger } from 'loglevel';
import { ceil, mean } from 'mathjs';

const logger = getLogger('Energy');

export class Energy {
    constructor(private readonly bandCount: number) { }

    compute = (intensities: Array<number>): Float32Array => {
        logger.debug(`computing energies for ${intensities}`);
        const bandSize = ceil(intensities.length / this.bandCount);
        const energies = new Float32Array(this.bandCount);

        for (let i = 0; i < this.bandCount; i++) {
            const offset = i * bandSize;
            const limit = Math.min(offset + bandSize, intensities.length);
            energies[i] = mean(intensities.slice(offset, limit));
        }

        logger.debug(`computed energies: ${energies}`);
        return energies;
    };
}
