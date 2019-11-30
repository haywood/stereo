import { zeros, dot, equal, min } from "mathjs";
import { Fn } from "./fn";

export default class Stereo implements Fn {
  constructor(private readonly from: number, private readonly to: number) {}

  get domain() {
    return this.from;
  }

  get d() {
    return this.to;
  }

  fn = (x: number[]) => {
    const { from, to } = this;
    if (from < to) {
      return Stereo.up(x, to);
    } else if (from > to) {
      return Stereo.down(x, to);
    } else {
      return x;
    }
  };

  static up = (p, to) => {
    const q = new Array(p.length + 1).fill(0);
    const norm2 = dot(p, p);
    const divisor = norm2 + 1;
    q[0] = (norm2 - 1) / divisor;
    for (let i = 1; i <= p.length; i++) {
      q[i] = (2 * p[i - 1]) / divisor;
    }

    if (q.length >= to) {
      return q;
    } else {
      return Stereo.up(q, to);
    }
  };

  static down = (p, to) => {
    const q = new Array(p.length - 1).fill(0);
    for (let i = 0; i < q.length; i++) {
      q[i] = p[i + 1] / (1 - p[0]);
    }

    if (q.length <= to) {
      return q;
    } else {
      return Stereo.down(q, to);
    }
  };
}
