import { Fn, CompositeFn } from '../fn/fn';
import { EvalFunction } from 'mathjs';

export type Params = {
    pipe: string;
    theta?: string;
    h?: string;
    l?: string;
    t?: number;
    power?: number;
    chroma?: number;
};

export type NormalizedParams = {
    pipe: string;
    theta: string;
    h: string;
    l: string;
    t: number;
    power: number;
    chroma: number;
};

export type UnaryOperator = (x: number) => number;

export type Scope = {
    t: number;
    power: number;
    chroma: number;
    n?: number;
    theta?: number;
};

export type HL = {
    h: EvalFunction;
    l: EvalFunction;
};

export type Substitutions = {
    [id: string]: ASTNode;
};

export type CompiledAST = {
    n: number;
    init: CompositeFn;
    iter: CompositeFn;
};

export type Link = {
    fn: Fn;
    isTemporal: boolean;
};

export type Value = number | Function;

export type ASTNode = {
    n?: number;
    chain?: ASTNode[];
    fn?: string;
    args?: ASTNode[];
    op?: string;
    operands?: ASTNode[];
    value?: number | Function;
    id?: string;
    sub?: ASTNode;
};

export type Chunk = {
    offset: number;
    size: number;
};

export type PipelineWorker = {
    initialize(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
    iterate(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
};
