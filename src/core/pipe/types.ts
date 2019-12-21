import { ASTNode } from './grammar.pegjs';

export type Params = {
    pipe: string;
    theta?: string;
    h?: string;
    l?: string;
    t?: number;
    bpm?: number;
    ebeat?: number;
    esong?: number;
};

export type UnaryOperator = (x: number) => number;

export type CompiledParams = {
    pipe: SimplifiedAST;
    h: math.EvalFunction;
    l: math.EvalFunction;
    theta: string;
    scope: Scope;
};

export type Scope = {
    t: number;
    bpm: number;
    ebeat: number;
    esong: number;
    n?: number;
    theta?: number;
};

export type Substitutions = {
    [id: string]: ASTNode;
};

export type SimplifiedAST = {
    n: number;
    chain: SimplifiedFunctionCall[];
};

export type SimplifiedFunctionCall = {
    fn: string;
    args: Value[];
    isTemporal: boolean;
};

export type Value = number | Function;
