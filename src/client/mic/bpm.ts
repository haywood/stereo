import { CircularBuffer } from "./circular_buffer";
import { getLogger } from 'loglevel';

const logger = getLogger('Bpm');

export class Bpm {
    private readonly times: CircularBuffer<Float64Array>;
    private samples = 0;

    constructor(memory: number) {
        this.times = new CircularBuffer(Float64Array, memory);

    }

    get value() {
        return this.times.length * this.bpmRatio;
    }

    private get bpmRatio() {
        if (this.samples >= this.times.length) {
            const newest = Math.max(...this.times);
            const oldest = Math.min(...this.times);
            return 60_000 / (newest - oldest);
        } else {
            return 0;
        }
    }

    update = (now: number) => {
        this.times.set(now);
        this.samples++;
    };
}
