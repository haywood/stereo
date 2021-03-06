declare module '*.glsl' {
  declare const source: string;
  export default source;
}

declare module 'circular-buffer' {
  export default class CircularBuffer<T> {
    constructor(capacity: number);
    capacity(): number;
    get(index: number): T;
    get(start: number, end: number): Array<T>;
    push(t: T): void;
    size(): number;
    toarray(): Array<T>;
  }
}

declare type PowerWorkletParams = {
  dbMin: Float32Array;
  dbMax: Float32Array;
};

declare abstract class AudioWorkletProcessor<P = never> {
  constructor(options: AudioWorkletNodeOptions);

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters?: P
  ): boolean;

  protected readonly port: MessagePort;
}

declare function registerProcessor(
  name: string,
  ctor: new (options: AudioWorkletNodeOptions) => AudioWorkletProcessor
);

/**
 * Defined on AudioWorkletGlobalScope. The sampling
 * rate of the AudioContext that created the worklet.
 */
declare var sampleRate: number;

/**
 * Defiend on AudioWorkletGlobalScope. The currentTime
 * of the AudioContext that created the worklet.
 */
declare var currentTime: number;

/**
 * Defiend on AudioWorkletGlobalScope. The currentFrame
 * of the AudioContext that created the worklet.
 */
declare var currentFrame: number;

declare var _debug: any;

declare interface MultirangeHTMLInputElement extends HTMLInputElement {
  valueLow: number;
  valueHigh: number;
}

// fix broken type from lib.dom.ts
declare interface AudioParamMap extends Map<string, AudioParam> {}

declare interface HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}
