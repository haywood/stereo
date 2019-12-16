import assert from 'assert';

type FloatArray = Float32Array | Float64Array;

export class CircularBuffer<T extends FloatArray> {
    readonly buffer: T;
    readonly length: number;
    private offset = 0;

    constructor(ctor: new (l: number) => T, length: number) {
        assert(length, 'Empty CircularBuffer is useless CircularBuffer');
        this.buffer = new ctor(length);
        this.length = length;
    }

    set = (x: number) => {
        this.buffer[this.offset] = x;
        this.offset = (this.offset + 1) % this.buffer.length;
    };

    get = () => this.buffer[this.offset];
}
