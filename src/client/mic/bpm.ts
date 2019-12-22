import { CircularBuffer } from "./circular_buffer";
import { getLogger } from 'loglevel';

const logger = getLogger('Bpm');

export class Bpm {
    private readonly times: CircularBuffer<Float64Array> = new CircularBuffer(Float64Array, 60);

    get value() {
        return this.times.length * this.bpmRatio;
    }

    private get bpmRatio() {
        const newest = Math.max(...this.times);
        const oldest = Math.min(...this.times);
        if (oldest && oldest != newest) {
            return 60_000 / (newest - oldest);
        } else {
            return 0;
        }
    }

    update = (now: number) => this.times.set(now);
}
