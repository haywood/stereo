import { Audio } from '../audio/types';
export type Scope = Audio & {
  t: number;
  inf: number;
  extent: [number, number, number];
  n?: number;
  p?: Float32Array;
  i?: number;
  max?: number;
};
