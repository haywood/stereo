import assert from 'assert';

export type Vector = Float32Array;

export class Data {
  constructor(
    readonly n: number,
    readonly d: number,
    readonly position: Float32Array,
    readonly color: Float32Array
  ) {}

  static fromBuffer = (buffer: ArrayBuffer) => {
    const data = new Float32Array(buffer);
    const n = data[Data.nOffset];
    const d = data[Data.positionOffset(data)];
    const position = Data.position(data);
    const color = Data.color(data);
    return new Data(n, d, position, color);
  };

  static bufferFor = (n: number, d0: number, d: number): ArrayBuffer => {
    const bytesPerNum = 4;
    const count = 3 + n * (d0 + d + 3);
    const byteLength = bytesPerNum * count;
    const buffer = new ArrayBuffer(byteLength);
    const data = new Float32Array(buffer);
    data[Data.nOffset] = n;
    data[Data.inputOffset] = d0;
    data[Data.positionOffset(data)] = d;
    return buffer;
  };

  static input = (arr: Float32Array) => {
    const offset = Data.inputOffset + 1;
    return arr.subarray(offset, offset + Data.inputLength(arr));
  };

  static position = (arr: Float32Array) => {
    const offset = Data.positionOffset(arr) + 1;
    return arr.subarray(offset, offset + Data.positionLength(arr));
  };

  static color = (arr: Float32Array) => {
    const offset = Data.colorOffset(arr);
    return arr.subarray(offset);
  };

  static nOffset = 0;

  static inputOffset = Data.nOffset + 1;
  private static inputLength = (arr: Float32Array) => {
    const n = arr[Data.nOffset];
    const d0 = arr[Data.inputOffset];
    return n * d0;
  };

  static positionOffset = (arr: Float32Array) =>
    Data.inputOffset + Data.inputLength(arr) + 1;
  private static positionLength = (arr: Float32Array) => {
    const n = arr[Data.nOffset];
    const d = arr[Data.positionOffset(arr)];
    return n * d;
  };

  static colorOffset = (arr: Float32Array) =>
    Data.positionOffset(arr) + Data.positionLength(arr) + 1;

  static get = (arr: Vector, i: number, stride: number) => {
    const offset = i * stride;
    return arr.subarray(offset, offset + stride);
  };

  static set = (
    arr: Vector,
    value: ArrayLike<number>,
    i: number,
    stride: number
  ) => {
    assert(value.length <= stride);
    const offset = i * stride;
    return arr.set(value, offset);
  };
}
