import { abs, mean, variance, max, min } from 'mathjs';
import assert from 'assert';
import { pp } from '../../core/pp';

type Entry = {
    v: number;
    t: number;
};

export class History {
    private readonly buffer: Entry[];
    private cursor: number = 0;

    constructor(memory: number) {
        this.buffer = new Array(memory);
    }

    get length() {
        return this.buffer.length;
    }

    get spread() {
        const ts = this.nonzero.map(e => e.t);
        return ts.length ? max(ts) - min(ts) : 0;
    }

    get values() {
        return this.nonzero.map(e => e.v);
    }

    private get nonzero() {
        return this.buffer.filter(e => !!e);
    }

    mean = () => mean(this.values);

    var = () => variance(this.values);

    /**
     * Returns the average rate of change of the signal, relative
     * to the history's spread.
     */
    delta = () => {
        const nz = this.nonzero;
        const deltas = [];

        for (let i = 1; i < nz.length; i++) {
            const dv = abs(nz[i].v - nz[i - 1].v);
            const dt = abs(nz[i].t - nz[i - 1].t);
            deltas.push(dv / dt);
        }

        const finiteDeltas = deltas.filter(d => isFinite(d) && !isNaN(d));
        return this.spread * mean(finiteDeltas);
    };

    set = (v: number): void => {
        this.buffer[this.cursor] = { v, t: Date.now() };
        this.cursor = (this.cursor + 1) % this.buffer.length;
    };
}
