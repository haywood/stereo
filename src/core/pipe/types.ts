import { Fn, CompositeFn } from '../fn/fn';
import { Operand } from './ast';

export type Params = {
    pipe: string;
    // TODO replace with more general concept of user-defined variables
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
