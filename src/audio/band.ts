import { BandName } from '../inputs/pipe/ast';
import { mean } from '../reducable';

const { abs, log2 } = Math;

const dbMin = -100;
const dbMax = 0;

export class Band {
  static readonly low = new Band(16, 512, BandName.LOW);
  static readonly mid = new Band(512, 2048, BandName.MID);
  static readonly high = new Band(2048, 32768, BandName.HIGH);

  static readonly spectrum = [Band.low, Band.mid, Band.high];

  static index(name: BandName): number {
    return Band.spectrum.findIndex(b => b.name == name);
  }

  constructor(
    readonly lo: number,
    readonly hi: number,
    readonly name: BandName
  ) {}

  power(quantum: Float32Array) {
    return mean(this.normalize(quantum));
  }

  filter(ctx: AudioContext) {
    const { lo, hi } = this;
    const frequency = (lo + hi) / 2;
    const Q = 1 / (hi - lo);

    return new BiquadFilterNode(ctx, {
      type: 'bandpass',
      frequency,
      Q
    });
  }

  private normalize(window: Float32Array): Float32Array {
    for (let i = 0; i < window.length; i++) {
      let tmp = abs(window[i]); // [0, 1]
      tmp = 10 * log2(tmp); // [-Inf, 0]
      tmp = this.threshold(tmp); // [dbMin, dbMax]
      tmp = (tmp - dbMin) / (dbMax - dbMin); // [0, 1]

      window[i] = tmp;
    }
    return window;
  }

  private threshold(dbs: number) {
    if (dbs < dbMin) {
      return dbMin;
    } else if (dbs > dbMax) {
      return dbMax;
    }
    return dbs;
  }
}
