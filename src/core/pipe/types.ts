import { ASTNode } from './grammar.pegjs';
import { Fn } from '../fn/fn';

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
    pipe: CompiledAST;
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

export type CompiledAST = {
    n: number;
    chain: Link[];
};

export type Link = {
    fn: Fn;
    isTemporal: boolean;
};

export type Value = number | Function;
