import { Fn } from "../fn/fn";

import { Scalar } from "./ast";

export type Params = {
  pipe: string;
  // TODO replace with more general concept of user-defined variables
  theta?: string;
  h?: string;
  v?: string;
  t?: number;
  power?: number;
  chroma?: number;
  onset?: 0 | 1;
};

export type NormalizedParams = {
  pipe: string;
  theta: string;
  h: string;
  v: string;
  t: number;
  power: number;
  chroma: number;
  onset: 0 | 1;
};

export type UnaryOperator = (x: number) => number;

export type Scope = {
  t: number;
  power: number;
  chroma: number;
  onset: 0 | 1;
  inf: number;
  n?: number;
  p?: Float32Array;
  i?: number;
  max?: number;
};

export type HV = {
  h: Scalar;
  v: Scalar;
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
