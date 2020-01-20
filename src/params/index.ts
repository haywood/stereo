import { PipeNode, Scalar } from './grammar.pegjs';
import { Scope } from './scope';

export type Params = {
  pipe: PipeNode;
  scope: Scope;
  hsv: HSV;
};

export type HSV = {
  h: Scalar;
  s: Scalar;
  v: Scalar;
};
