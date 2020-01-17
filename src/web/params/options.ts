import { PipeNode, Scalar } from '*.pegjs';
import { Audio } from '../../audio/types';

export type Options = {
  pipe: PipeNode;
  theta: Scalar;
  audio: Audio;
  h: Scalar;
  v: Scalar;
  t: number;
};
