import { Beat } from './beat';

export type Music = {
    beat: Beat;
    esong: number;
};

export type MusicWorker = {
    analyze(buffer: SharedArrayBuffer): Music;
};
