import { Fn } from '../fn';
import { PipeNode, Scalar } from './grammar.pegjs';
import { Scope } from './scope';

export type Params = {
  pipe: PipeNode;
  scope: Scope;
  hv: HV;
};

export type Defs = {
  // TODO replace with more general concept of user-defined variables
  theta: string;
};

export type UnaryOperator = (x: number) => number;

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
