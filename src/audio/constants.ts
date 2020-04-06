import { Audio } from './types';

/**
 * This defines the placeholder used for power and chroma when audio is not enabled.
 */
export const AUDIO_PLACEHOLDER: Audio = {
  enabled: false,
  low: 0,
  mid: 0,
  high: 0,
  full: 0,
};

export const chromaCount = 12;
export const octaveMin = 0;
export const octaveMax = 8;
export const octaveCount = octaveMax - octaveMin;
export const quantumSize = 128;
export const binCount = octaveCount * chromaCount;
