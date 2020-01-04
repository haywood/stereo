import { Audio } from './types';

/**
 * This defines the values used for power and chroma when audio is not enabled.
 */
export const NO_AUDIO: Audio = {
  power: 1,
  chroma: 0.5,
};

export const chromaCount = 12;
export const octaveMin = 0;
export const octaveMax = 8;
export const octaveCount = octaveMax - octaveMin;
export const frameSize = 128;
export const binCount = octaveCount * chromaCount;
