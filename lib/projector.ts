import { zeros, dot, equal, min } from "mathjs";

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
    from++;

    points = points.map(p => {
      const q = new Array(from).fill(0);
      const norm2 = dot(p, p);
      const divisor = norm2 + 1;
      q[0] = (norm2 - 1) / divisor;
      for (let d = 1; d < from; d++) {
        q[d] = (2 * p[d - 1]) / divisor;
      }
      return q;
    });

    if (from >= to) {
      return points;
    } else {
      return this.stereoUp(points, from, to);
    }
  }

  static stereoDown(points, from, to) {
    from--;

    points = points.map(p => {
      const q = new Array(from).fill(0);
      for (let i = 0; i < from; i++) {
        q[i] = p[i + 1] / (1 - p[0]);
      }
      return q;
    });

    if (from <= to) {
      return points;
    } else {
      return this.stereoDown(points, from, to);
    }
  }
}
