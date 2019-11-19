import memoize from "memoizee";
import {
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Geometry,
  Points,
  VertexColors,
  Scene,
  Color,
  Vector3,
  PerspectiveCamera,
  WebGLRenderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh
} from "three";
import {
  cos,
  sin,
  norm,
  pi,
  tau,
  Matrix,
  reshape,
  identity,
  matrix,
  multiply,
  abs,
  tan,
  MathType,
  format,
  clone,
  flatten,
  round
} from "mathjs";
import Projector from "./projector";

export default class HalveAndDouble {
  points = [];
  private readonly cos = memoize(cos);
  private readonly sin = memoize(sin);

  constructor(
    private readonly dimension: number,
    private readonly order: number
  ) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
  }

  generatePoints() {
    // generates C(order) points where C(o) = (1 + 2 ** o) * C(o - 1), C(0) =
    // dimension
    // This is done by generating seed points and then rotating them through
    // the first 2 ** (o-1) odd multiples of pi / 2 ** o
    // The affect of this is to halve the angle at each step and double the
    // number of points
    const { dimension, order } = this;
    const planes = [];
    for (let d = 0; d < dimension; d++) {
      const p = this.one(d);
      planes.push([p]);
    }

    if (order > 1) {
      for (let d = 0; d < dimension; d++) {
        const p = planes[d][0].slice();
        this.rotatePoint(p, { phi: pi, ...this.naturalPlane(d) });
        planes[d].push(p);
      }
    }

    for (let o = 2; o < order; o++) {
      const divisor = 2 ** o;
      const angleCount = divisor / 2;
      for (let d0 = 0; d0 < dimension; d0++) {
        planes[d0] = this.generatePointsFromPlane(planes[d0], {
          o,
          ...this.naturalPlane(d0)
        });
      }
    }

    // an additonal rotation of a singe plane to fill space between axes
    if (dimension > 2) {
      for (let o = 2; o < order; o++) {
        const divisor = 2 ** o;
        const angleCount = divisor / 2;
        const d0 = 0;
        const d1 = dimension - 1;
        planes[1] = this.generatePointsFromPlane(planes[1], { o, d0, d1 });
      }
    }

    return planes.reduce((points, plane) => points.concat(plane), []);
  }

  naturalPlane(d) {
    return { d0: d, d1: (d + 1) % this.dimension };
  }

  generatePointsFromPlane(plane, { o, d0, d1 }) {
    const temp = plane.slice();
    for (const p of plane) {
      temp.push(...this.generatePointsFromPoint(p, { o, d0, d1 }));
    }
    return temp;
  }

  generatePointsFromPoint(p, { o, d0, d1 }) {
    const divisor = 2 ** o;
    const angleCount = divisor / 2;
    const temp = [];
    for (let n = 0; n < angleCount; n++) {
      const multiple = 2 * n + 1;
      const phi = (multiple * pi) / divisor;
      temp.push(this.generatePointFromPoint(p, { phi, d0, d1 }));
    }
    return temp;
  }

  generatePointFromPoint(p, { phi, d0, d1 }) {
    return this.rotatePoint(p.slice(), { phi, d0, d1 });
  }

  one(d: number) {
    const { dimension } = this;
    const p = new Array(dimension).fill(0);
    p[d] = 1;
    return p;
  }

  rotatePoint(p: number[], theta: { phi: number; d0: number; d1: number }) {
    const { phi, d0, d1 } = theta;
    const v = [p[d0], p[d1]];
    const R = matrix([
      [this.cos(phi), -this.sin(phi)],
      [this.sin(phi), this.cos(phi)]
    ]);
    const u = multiply(R, v).valueOf();
    p[d0] = round(u[0], 5) as number;
    p[d1] = round(u[1], 5) as number;
    return p;
  }
}
