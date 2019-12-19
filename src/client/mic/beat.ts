import { CircularBuffer } from "./circular_buffer";
import assert from 'assert';
import { mean } from "mathjs";
import { getLogger } from 'loglevel';

const logger = getLogger('Energy');

const fill = <T>(bandCount: number, f: () => T): T[] => {
    const arr = new Array(bandCount);
    for (let i = 0; i < arr.length; i++) arr[i] = f();
    return arr;
};

export class Beat {
    private readonly Es: CircularBuffer<Float32Array>[];
    private readonly durations: CircularBuffer<Float64Array>[];
    private readonly lasts: number[];
    private beat = 0;

    constructor(readonly bandCount: number, memory: number) {
        this.Es = fill(bandCount, () => new CircularBuffer(Float32Array, memory));
        this.durations = fill(bandCount, () => new CircularBuffer(Float64Array, memory));
        this.lasts = new Array(bandCount);
    }

    find = (es: ArrayLike<number>) => {
        assert.equal(
            es.length, this.bandCount,
            `Expected ${this.bandCount} energies, but got only ${es.length}`);
        logger.debug(`looking for beat in ${es}`);

        let Ebeat = mean(...this.Es[this.beat].buffer);
        for (let i = 0; i < this.bandCount; i++) {
            const e = es[i];
            const E = mean(...this.Es[i].buffer);
            if (e > E && E > Ebeat) {
                logger.info(`updating beat to ${i} from ${this.beat} e=${e} E=${E}, Ebeat=${Ebeat}`);
                this.beat = i;
                Ebeat = E;
            }
            this.Es[i].set(e);

            if (e > E) {
                const on = this.lasts[i];
                if (on) {
                    this.durations[i].set(Date.now() - on);
                }
                this.lasts[i] = Date.now();
            }
        }

        const e = es[this.beat];
        const E = this.Es[this.beat].get();
        return {
            e,
            E,
            bpm: mean(...this.durations[this.beat].buffer) / 60_000,
            on: e > E ? 1 : 0,
            last: this.lasts[this.beat],
        };
    };
}
