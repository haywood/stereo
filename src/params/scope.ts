import { Audio } from '../audio/types';

export type Scope = {
  t: number;
  inf: number;
  extent: [number, number, number];
  audio: Audio;
  n?: number;
  p?: Float32Array;
  i?: number;
  max?: number;
};
