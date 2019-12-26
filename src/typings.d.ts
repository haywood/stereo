declare module './grammar.pegjs' {
    export function parse(spec: string): AST;

    export function parse(spec: string, options: {
        startRule: 'arith';
    }): Arithmetic;
}
