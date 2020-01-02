// TODO make these inputs :D
export const fps = 60;
export const dataSampleRate = fps / 1000;
export const audioSampleRate = 2 * dataSampleRate;
export const fftSize = 1024;
export const psdSize = Math.floor(fftSize / 2) + 1;
