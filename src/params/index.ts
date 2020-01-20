import { PipeNode, Scalar } from './grammar.pegjs';
import { Scope } from './scope';

export type Params = {
  pipe: PipeNode;
  scope: Scope;
  hv: HV;
};

export type HV = {
  h: Scalar;
  v: Scalar;
};
