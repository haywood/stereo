import { Audio } from '../audio/types';

export type Scope = {
  t: number;
  inf: number;
  audio: Audio;
  p?: Float32Array;
};
