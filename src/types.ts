import { Audio } from './audio/types';
import { Scalar } from './inputs/pipe/ast';

export type Scope = {
  audio: Audio;
};

export type HSV = {
  h: Scalar;
  s: Scalar;
  v: Scalar;
};
