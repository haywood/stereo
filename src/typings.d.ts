declare module './grammar.pegjs' {
    export function parse(spec: string): AST;

    export function parse(spec: string, options: {
        startRule: 'arith';
    }): Arithmetic;
}

type PowerWorkletParams = {
    dbMin: Float32Array;
    dbMax: Float32Array;
};

abstract class AudioWorkletProcessor<P = never> {
    constructor(options: AudioWorkletNodeOptions);

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters?: P): boolean;

    protected readonly port: MessagePort;
}

function registerProcessor(name: string, ctor: new (options: AudioWorkletNodeOptions) => AudioWorkletProcessor);

/**
 * Defined on AudioWorkletGlobalScope. The sampling
 * rate of the AudioContext that created the worklet.
 */
const sampleRate: number;

/**
 * Defiend on AudioWorkletGlobalScope. The currentTime
 * of the AudioContext that created the worklet.
 */
const currentTime: number;
