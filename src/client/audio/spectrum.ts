import { chromaCount } from './constants';
import * as math from 'mathjs';

export class Spectrum {
    process = (frames: Float32Array[]): number[] => {
        return frames.map((frame, i) => {
            return this.processFrame(frame.length ? Array.from(frame) : [0]);
        });
    };

    /**
     * Computes the inverse of the RMS of the log intensities of the frame after
     * offsetting each log by -1. The goal is to map the intensities onto a
     * logarithmic scale with the same inputs, since this is closer to how humans
     * hear.
     */
    processFrame = (frame: number[]): number => {
        const intensities = math.abs(frame); // silent=0, loud=1
        const logIntensities = math.log10(intensities); // silent=-Infinity, loud=0
        const offsetLogIntensities = math.subtract(logIntensities, 1); // silent=-Infinity, loud=-1
        const bottom = math.norm(offsetLogIntensities); // silent=Infinity, loud=√frame.length
        const power = math.sqrt(frame.length) / bottom; // silent=0, loud=1
        return power;
    };

    static ocatave = (k: number) => math.floor(k / chromaCount);

    static chroma = (k: number) => k % chromaCount;

    static f = (k: number): number => {
        const octave = Spectrum.ocatave(k);
        const chroma = Spectrum.chroma(k);
        const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html

        return c0 * 2 ** octave * math.nthRoot(2, chromaCount) ** chroma;
    };
}
