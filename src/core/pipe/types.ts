import { Fn, CompositeFn } from '../fn/fn';
import { EvalFunction } from 'mathjs';

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
    theta?: number;
};

export type HV = {
    h: EvalFunction;
    v: EvalFunction;
};

export type Substitutions = {
    [id: string]: ArithNode;
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

export type Operand = ScalarNode | ArithNode | FnNode;

export type ArithNode = {
    kind: 'arith';
    op: string;
    operands: [Operand, Operand];
};

export type FnNode = {
    kind: 'fn';
    name: string;
    args: Operand[];
};

export type ScalarNode = {
    kind: 'scalar';
    id?: string;
    value?: number | Function;
};

export type StepNode = {
    kind: 'step';
    fn: string,
    args: Operand[],
};

export type PipeNode = {
    kind: 'pipe';
    n: number;
    chain: StepNode[];
};

export type ASTNode = PipeNode | StepNode | ScalarNode | ArithNode | FnNode;

export type Chunk = {
    offset: number;
    size: number;
};

export type PipelineWorker = {
    initialize(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
    iterate(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
};
