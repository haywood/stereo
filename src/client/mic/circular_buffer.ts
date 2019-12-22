import assert from 'assert';

type FloatArray = Float32Array | Float64Array;

export class CircularBuffer<T extends FloatArray> {
    private readonly buffer: T;
    private offset = 0;

    constructor(ctor: new (l: number) => T, length: number) {
        assert(length, 'Empty CircularBuffer is useless CircularBuffer');
        this.buffer = new ctor(length);
    }

    [Symbol.iterator]() {
        return this.buffer[Symbol.iterator]();
    }

    get length() {
        return this.buffer.length;
    }

    set = (x: number) => {
        this.buffer[this.offset] = x;
        this.offset = (this.offset + 1) % this.buffer.length;
    };

    get = () => this.buffer[this.offset];
}
