import { Fn } from '../fn';
import { Params } from '../params';

export type Defs = {
  // TODO replace with more general concept of user-defined variables
  theta: string;
};

export type UnaryOperator = (x: number) => number;

export type Link = {
  fn: Fn;
  isDynamic: boolean;
};

export type Chunk = {
  offset: number;
  size: number;
};

export type PipelineWorker = {
  iterate(params: Params, chunk: Chunk, buffer: SharedArrayBuffer): void;
};
