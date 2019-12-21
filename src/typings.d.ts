import { Pipe } from "./core/pipe/pipe";

declare module 'worker-loader!*' {
    class PipelineWorker extends Worker {
        constructor();
    }

    export default PipelineWorker;
}

declare module 'pegjs-loader?allowedStartRules[]=pipe,allowedStartRules[]=arith!*' {
    export function parse(spec: string, options: {
        substitutions?: { [name: string]: any; };
    }): AST;

    export function parse(spec: string, options: {
        startRule: 'arith';
    }): Arithmetic;

    export interface SyntaxError extends Error { }

    export interface ASTNode {
        n?: number;
        chain?: ASTNode[];
        fn?: string;
        args?: ASTNode[];
        op?: string;
        operands?: ASTNode[];
        value?: number;
        id?: string;
        sub?: ASTNode;
    }
}
