import { CircularBuffer } from "./circular_buffer";
import assert from 'assert';
import { mean } from "mathjs";
import { getLogger } from 'loglevel';
import { Bpm } from "./bpm";

const logger = getLogger('Energy');
logger.setDefaultLevel('info');

const fill = <T>(bandCount: number, f: () => T): T[] => {
    const arr = new Array(bandCount);
    for (let i = 0; i < arr.length; i++) arr[i] = f();
    return arr;
};

export type Beat = {
    e: number;
    bpm: number;
    time: number;
};

export class BeatFinder {
    private readonly es: CircularBuffer<Float32Array>[];
    private readonly bpm = new Bpm();

    constructor(readonly bandCount: number, memory: number) {
        this.es = fill(bandCount, () => new CircularBuffer(Float32Array, memory));
    }

    find = (es: Float32Array) => {
        assert.equal(
            es.length, this.bandCount,
            `Expected ${this.bandCount} energies, but got only ${es.length}`);
        logger.debug(`looking for beat in ${es}`);

        let ebeat = 0, on = false;
        for (let i = 0; i < this.bandCount; i++) {
            const e = es[i];
            const E = mean(...this.es[i]);
            const C = 1.3;
            this.es[i].set(e);

            if (e > C * E && !on) {
                logger.debug(`found beat at band ${i} e=${e} E=${E}`);
                ebeat = e;
                on = true;
            }
        }

        const now = Date.now();
        if (on) this.bpm.update(now);

        return {
            e: ebeat,
            bpm: this.bpm.value,
            time: now,
        };
    };
}
