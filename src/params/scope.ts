import { Audio } from '../audio/types';

export type Scope = {
  t: number;
  inf: number;
  extent: [number, number, number];
  audio: Audio;
  p?: Float32Array;
};
