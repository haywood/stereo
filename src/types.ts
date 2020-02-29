import { Scalar } from './pipe/ast';
import { Audio } from './audio/types';

export type Scope = {
  audio: Audio;
};

export type HSV = {
  h: Scalar;
  s: Scalar;
  v: Scalar;
};
