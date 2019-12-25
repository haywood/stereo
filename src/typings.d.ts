import { Pipe } from "./core/pipe/pipe";

declare module 'worker-loader!*' {
    class PipelineWorker extends Worker {
        constructor();
    }

    export default PipelineWorker;
}

declare module './grammar.pegjs' {
    export function parse(spec: string): AST;

    export function parse(spec: string, options: {
        startRule: 'arith';
    }): Arithmetic;
}
