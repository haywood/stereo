declare module 'worker-loader!*' {
    class PipelineWorker extends Worker {
        constructor();
    }

    export default PipelineWorker;
}

declare module 'pegjs-loader!*' {
    export function parse(spec: string);
    export interface SyntaxError extends Error { }
}

type AudioWorkletParameters = {
    [index: string]: Float32Array;
};

abstract class AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: AudioWorkletParameters,
    ): boolean { }

    port: MessagePort;
}

function registerProcessor(name: string, ctor: typeof AudioWorkletProcessor) { }

declare module "worklet-loader?name=[name].worklet.js!*" {
    const exportString: string;
    export default exportString;
}
