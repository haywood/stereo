import { cos, sin } from "./fn";

export default class Rotator {
  static rotatePoint(p: number[], { phi, d0, d1 }) {
    const v = [p[d0], p[d1]];
    p[d0] = cos(phi) * v[0] - sin(phi) * v[1];
    p[d1] = sin(phi) * v[0] + cos(phi) * v[1];
    return p;
  }
}
