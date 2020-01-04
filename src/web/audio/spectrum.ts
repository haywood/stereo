import { chromaCount } from './constants';

export class Spectrum {
  constructor(public dbMin: number, public dbMax: number) {}

  static octave = (k: number) => Math.floor(k / chromaCount);

  static chroma = (k: number) => k % chromaCount;

  static f = (k: number): number => {
    const octave = Spectrum.octave(k);
    const chroma = Spectrum.chroma(k);
    const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html

    return c0 * 2 ** octave * Math.pow(2, 1 / chromaCount) ** chroma;
  };
}
