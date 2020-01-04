export class Power {
  constructor(
      public dbMin: number,
      public dbMax: number,
  ) {}

  process = (frames: Float32Array[]): number[] => {
    return frames.map((frame, i) => {
      return this.processFrame(frame.length ? Array.from(frame) : [0]);
    });
  };

  private processFrame = (frame: number[]): number => {
    const amp = this.ampMax(frame);             // silent=0, loud=1
    const dbs = this.dbs(amp);                  // silent=-Infinity, loud=0
    const dbsm1 = this.thresholdAndShift(dbs);  // silent=-Infinity, loud=-1
    return 1 / Math.abs(dbsm1);                 // silent=0, loud=1
  };

  private ampMax = (frame: number[]) => Math.max(...frame.map(Math.abs));

  private dbs = amp => 10 * Math.log2(amp);

  private thresholdAndShift = dbs => {
    if (this.dbMax === this.dbMin) {
      return dbs === this.dbMax ? -1 : -Infinity;
    }

    dbs = Math.min(this.dbMax, Math.max(this.dbMin, dbs));
    return (dbs - this.dbMax) / (dbs - this.dbMin) - 1;
  };
}
