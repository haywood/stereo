declare module 'worker-loader!*' {
    class PipelineWorker extends Worker {
        constructor();
    }

    export default PipelineWorker;
}

declare module 'pegjs-loader!*' {
    export function parse(spec: string, options: {
        symbols: { [name: string]: string | number; };
        math: typeof mathjs;
    });
    export interface SyntaxError extends Error { }
}
