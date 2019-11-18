import { zeros, dot } from "mathjs";
export default class Projector {
  static stereo(points, from: number, to: number) {
    if (from < to) {
      return this.stereoUp(points, from, to);
    } else if (from > to) {
      return this.stereoDown(points, from, to);
    } else {
      return points.slice();
    }
  }

  static stereoUp(points, from, to) {
    points = points.map(p => {
      const q = new Array(from + 1).fill(0);
      const norm2 = dot(p, p);
      const divisor = norm2 + 1;
      q[0] = (norm2 - 1) / divisor;
      for (let d = 1; d < from + 1; d++) {
        q[d] = (2 * p[d - 1]) / divisor;
      }
      return q;
    });

    if (from >= to - 1) {
      return points;
    } else {
      return this.stereoUp(points, from + 1, to);
    }
  }

  static stereoDown(points, from, to) {
    points = points.map(p => {
      const q = new Array(from - 1).fill(0);
      for (let d = 0; d < from - 1; d++) {
        q[d] = p[d] / (1 - p[0]);
      }
      return q;
    });

    if (from <= to + 1) {
      return points;
    } else {
      return this.stereoDown(points, from - 1, to);
    }
  }
}
