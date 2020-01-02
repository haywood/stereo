import { Fn, CompositeFn } from '../fn/fn';
import { Operand } from './ast';

export type Params = {
    pipe: string;
    theta?: string;
    h?: string;
    v?: string;
    t?: number;
    power?: number;
    chroma?: number;
};

export type NormalizedParams = {
    pipe: string;
    theta: string;
    h: string;
    v: string;
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
    p?: Float32Array;
    i?: number;
};

export type HV = {
    h: Operand;
    v: Operand;
};

export type CompiledAST = {
    n: number;
    staticFn: CompositeFn;
    dynamicFn: CompositeFn;
};

export type Link = {
    fn: Fn;
    isDynamic: boolean;
};

export type Chunk = {
    offset: number;
    size: number;
};

export type PipelineWorker = {
    initialize(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
    iterate(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
};
