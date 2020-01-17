import assert from 'assert';
import { binCount, chromaCount, octaveCount } from './constants';

const c0 = 16.35; // c0 per https://pages.mtu.edu/~suits/notefreqs.html

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

    return c0 * 2 ** (octave + chroma / chromaCount);
  };

  static hue = (k: number) => {
    const chromaStep = 1 / chromaCount;
    const octaveStep = chromaStep / octaveCount;
    return chromaStep * Spectrum.chroma(k) + octaveStep * Spectrum.octave(k);
  };

  static fmax = c0 * 2 ** binCount;

  /**
   * Compute the relative pitch of bin k.
   */
  static pitch = (k: number) => Spectrum.chroma(k) / (chromaCount - 1);
}
