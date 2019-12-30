import { Audio } from "./types";

export const SILENCE: Audio = {
    power: 0,
    chroma: 0,
};

export const chromaCount = 12;
export const octaveMin = 0;
export const octaveMax = 8;
export const octaveCount = octaveMax - octaveMin;
export const frameSize = 128;
export const binCount = octaveCount * chromaCount;
