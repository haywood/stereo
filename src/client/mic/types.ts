export type Music = {
    esong: number;
    dsong: number;
};

export type MusicWorker = {
    analyze(buffer: Array<number>): Music;
};
