import { Pipe } from "./core/pipe/pipe";

declare module 'worker-loader!*' {
    class PipelineWorker extends Worker {
        constructor();
    }

    export default PipelineWorker;
}

declare module 'pegjs-loader?allowedStartRules[]=pipe,allowedStartRules[]=arithmetic!*' {
    export function parse(spec: string, options: {
        startRule?: 'pipe';
        substitutions?: { [name: string]: any; };
    }): AST;

    export function parse(spec: string, options: {
        startRule: 'arithmetic';
    }): Arithmetic;

    export interface SyntaxError extends Error { }

    export type AST = {
        n: number;
        chain: FunctionCall[];
    };

    export type FunctionCall = {
        op: string;
        args: Arg[];
    };

    export type Arithmetic = {
        op?: string;
        args?: Arg[];
        scalar?: Scalar;
    };

    export type Arg = {
        arithmetic: Arithmetic;
        scalar: Scalar;
    };

    export type Scalar = {
        id?: string;
        value?: Value;
    };

    export type Value = number | Function;
}
