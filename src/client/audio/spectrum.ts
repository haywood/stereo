import { chromaCount } from './constants';
import * as math from 'mathjs';

export class Spectrum {
    process = (frames: Float32Array[]): number[] => {
        return frames.map((frame, i) => {
            return this.processFrame(frame.length ? Array.from(frame) : [0]);
        });
    };

    processFrame = (frame: number[]): number =>
        5 * math.mean(math.abs(frame));

    static ocatave = (k: number) => math.floor(k / chromaCount);

    static chroma = (k: number) => k % chromaCount;

    static f = (k: number): number => {
        const octave = Spectrum.ocatave(k);
        const chroma = Spectrum.chroma(k);
        const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html

        return c0 * 2 ** octave * math.nthRoot(2, chromaCount) ** chroma;
    };
}
