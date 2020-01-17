import assert from 'assert';
import { binCount, chromaCount } from './constants';

export class Spectrum {
  constructor(public dbMin: number, public dbMax: number) {}

  static octave = (k: number) => Math.floor(k / chromaCount);

  static chroma = (k: number) => k % chromaCount;

  /**
   * Compute the frequency of bin k.
   */
  static f = (k: number): number => {
    assert(
      0 <= k && k < binCount,
      `Spectrum.f: expected 0 <= k = ${k} < ${binCount}`
    );
    const octave = Spectrum.octave(k);
    const chroma = Spectrum.chroma(k);
    const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html

    return c0 * 2 ** (octave + chroma / chromaCount);
  };

  static fmax = Spectrum.f(binCount - 1);

  /**
   * Compute the relative pitch of bin k.
   */
  static pitch = (k: number) => Spectrum.f(k) / Spectrum.fmax;
}
