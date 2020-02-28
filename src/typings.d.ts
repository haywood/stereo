declare module '*.glsl' {
  declare const source: string;
  export default source;
}

declare module '*.pegjs' {
  declare const grammar: string;
  export default grammar;

  export function parse(spec: string): PipeNode;
  export function parse(spec: string, options: { startRule: 'scalar' }): Scalar;

  export type PipeNode = {
    kind: 'pipe';
    n: number;
    d0: number;
    steps: StepNode[];
  };

  export type StepNode = {
    kind: 'step';
    type:
      | 'sphere'
      | 'spiral'
      | 'torus'
      | 'lattice'
      | 'cube'
      | 'rotate'
      | 'stereo'
      | 'quaternion';
    args: Scalar[];
  };

  export type Scalar =
    | ArithNode
    | NumberNode
    | FnNode
    | AccessNode
    | IdNode
    | ParenNode;

  export type ArithNode = {
    kind: 'arith';
    op: '*' | '/' | '+' | '-' | '**' | '^';
    operands: [Scalar, Scalar];
  };

  export type NumberNode = {
    kind: 'number';
    value: number;
  };

  export type FnNode = {
    kind: 'fn';
    name: string;
    args: Scalar[];
  };

  export type AccessNode = {
    kind: 'access';
    id: string;
    index: Scalar;
  };

  export type IdNode = {
    kind: 'id';
    id: string;
  };

  export type ParenNode = {
    kind: 'paren';
    scalar: Scalar;
  };

  export type Value = number | Function;
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
