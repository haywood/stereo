import { ASTNode } from './grammar.pegjs';
import { Fn } from '../fn/fn';
import { EvalFunction } from 'mathjs';

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

export type NormalizedParams = {
    pipe: string;
    theta: string;
    h: string;
    l: string;
    t: number;
    bpm: number;
    ebeat: number;
    esong: number;
};

export type UnaryOperator = (x: number) => number;

export type Scope = {
    t: number;
    bpm: number;
    ebeat: number;
    esong: number;
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
    chain: Link[];
};

export type Link = {
    fn: Fn;
    isTemporal: boolean;
};

export type Value = number | Function;
