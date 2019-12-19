import { CircularBuffer } from "./circular_buffer";
import { getLogger } from 'loglevel';

const logger = getLogger('Bpm');

export class Bpm {
    private readonly times: CircularBuffer<Float64Array> = new CircularBuffer(Float64Array, 60);

    get value() {
        // TODO: This still outputs super high values.
        // Not sure if it's because of a bug or because
        // the standard definition of bpm has some quirk.
        return this.times.length * this.bpmRatio;
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
