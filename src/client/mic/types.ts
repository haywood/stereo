export type Music = {
    esong: number;
    dsong: number;
};

export type MusicWorker = {
    analyze(buffer: Float32Array): Music;
};
