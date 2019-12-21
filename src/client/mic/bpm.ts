import { CircularBuffer } from "./circular_buffer";
import { getLogger } from 'loglevel';

const logger = getLogger('Bpm');

export class Bpm {
    private readonly times: CircularBuffer<Float64Array> = new CircularBuffer(Float64Array, 60);

    get value() {
        // in practice the unscaled value is O(1000),
        // so scale down by 100 so that a typical song
        // will have bpm O(10)
        return this.times.length * this.bpmRatio / 100;
    }

    private get bpmRatio() {
        const newest = Math.max(...this.times.buffer);
        const oldest = Math.min(...this.times.buffer);
        if (oldest && oldest != newest) {
            return 60_000 / (newest - oldest);
        } else {
            return 0;
        }
    }

    update = (now: number) => this.times.set(now);
}
