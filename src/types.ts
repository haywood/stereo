export type Vector = Float32Array;

export interface Data {
  readonly n: number;
  readonly d: number;
  readonly position: Float32Array;
  readonly color: Float32Array;
}

export interface Chunk {
  readonly offset: number;
  readonly size: number;
}

export type DataChunk = Data & Chunk;
