import { chromaCount } from './constants';
import * as math from 'mathjs';

export class Spectrum {
    static octave = (k: number) => math.floor(k / chromaCount);

    static chroma = (k: number) => k % chromaCount;

    static f = (k: number): number => {
        const octave = Spectrum.octave(k);
        const chroma = Spectrum.chroma(k);
        const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html

        return c0 * 2 ** octave * math.nthRoot(2, chromaCount) ** chroma;
    };

    process = (frames: Float32Array[]): number[] => {
        return frames.map((frame, i) => {
            return this.processFrame(frame.length ? Array.from(frame) : [0]);
        });
    };

    private processFrame = (frame: number[]): number => {
        const amp = this.ampMax(frame); // silent=0, loud=1
        const dbs = this.dbs(amp); // silent=-Infinity, loud=0
        const dbsm1 = this.thresholdAndShift(dbs); // silent=-Infinity, loud=-1
        return 1 / math.abs(dbsm1); // silent=0, loud=1
    };

    private ampMax = (frame: number[]) => math.max(math.abs(frame));

    private dbs = amp => 10 * math.log2(amp);

    private thresholdAndShift = dbs => {
        const min = -60;
        const max = -30;
        dbs = math.min(max, math.max(min, dbs));
        return (dbs - max) / (dbs - min) - 1;
    };
}
