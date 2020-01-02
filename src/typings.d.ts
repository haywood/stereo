declare module '*.html' {
    export default '';
}

declare module './grammar.pegjs' {
    export function parse(spec: string): AST;

    export function parse(spec: string, options: {
        startRule: 'arith';
    }): Arithmetic;
}

declare type PowerWorkletParams = {
    dbMin: Float32Array;
    dbMax: Float32Array;
};

declare abstract class AudioWorkletProcessor<P = never> {
    constructor(options: AudioWorkletNodeOptions);

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters?: P): boolean;

    protected readonly port: MessagePort;
}

declare function registerProcessor(name: string, ctor: new (options: AudioWorkletNodeOptions) => AudioWorkletProcessor);

/**
 * Defined on AudioWorkletGlobalScope. The sampling
 * rate of the AudioContext that created the worklet.
 */
declare readonly var sampleRate: number;

/**
 * Defiend on AudioWorkletGlobalScope. The currentTime
 * of the AudioContext that created the worklet.
 */
declare readonly var currentTime: number;

declare var _debug: any;

declare interface MultirangeHTMLInputElement extends HTMLInputElement {
    valueLow: number;
    valueHigh: number;
}
