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

    export interface SyntaxError extends Error { }

    export interface ASTNode {
        n?: number;
        chain?: ASTNode[];
        fn?: string;
        args?: ASTNode[];
        op?: string;
        operands?: ASTNode[];
        value?: number | Function;
        id?: string;
        sub?: ASTNode;
    }
}
