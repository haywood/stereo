import { Value } from "pegjs-loader?allowedStartRules[]=pipe,allowedStartRules[]=arithmetic!*";

export type Params = {
    pipe: string;
    theta?: string;
    h?: string;
    l?: string;
    t?: number;
    bpm?: number;
    ebeat?: number;
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
    n?: number;
    theta?: number;
};

export type SimplifiedAST = {
    n: number;
    chain: SimplifiedFunctionCall[];
};

export type SimplifiedFunctionCall = {
    op: string;
    args: Value[];
    isTemporal: boolean;
};
