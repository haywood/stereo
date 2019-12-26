export type Music = {
    eaudio: number;
    daudio: number;
};

export type MusicWorker = {
    analyze(buffer: Float32Array): Music;
};
