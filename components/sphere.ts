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

export default class Sphere {
  private readonly points = [];
  private readonly f0s = [];
  private readonly f1s = [];

  constructor(
    private readonly dimension: number,
    private readonly order: number,
    private readonly f0,
    private readonly f1
  ) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }

    this.points = this.generatePoints();
    console.log("generated points:", format(this.points));
  }

  get vertices() {
    const { dimension } = this;
    let { points } = this;

    if (dimension < 3) {
      points = points.map(p => [...p, ...new Array(3 - dimension).fill(0)]);
    } else if (dimension > 3) {
      points = points.map(p => p.slice(0, 3));
    }

    return flatten(points).valueOf() as number[];
  }

  get colors() {
    return this.vertices.map(x => 1);
  }

  rotate(theta: { phi: number; d0: number; d1: number }) {
    let { points, dimension } = this;

    if (dimension > 1) {
      points = points.map(p => {
        const q = p.slice();
        this.rotatePoint(q, theta);
        return q;
      });
    }

    if (dimension < 3) {
      points = points.map(p => [...p, ...new Array(3 - dimension).fill(0)]);
    } else if (dimension > 3) {
      points = points.map(p => p.slice(0, 3));
    }

    return flatten(points).valueOf() as number[];
  }

  generatePoints() {
    return this.halveAndDouble();
  }

  halveAndDouble() {
    const { dimension, order } = this;
    const planes = [];
    for (let d = 0; d < dimension; d++) {
      planes.push([this.one(d)]);
    }

    if (order > 0) {
      for (let d = 0; d < dimension; d++) {
        const p = this.one(d);
        p[d] = -1;
        planes[d].push(p);
      }
    }

    for (let o = 2; o < order; o++) {
      const divisor = 2 ** o;
      const angleCount = divisor / 2;
      for (let d0 = 0; d0 < dimension; d0++) {
        const d1 = (d0 + 1) % dimension;
        const temp = planes[d0].slice();
        for (const p of planes[d0]) {
          for (let n = 0; n < angleCount; n++) {
            const multiple = 2 * n + 1;
            const phi = (multiple * pi) / divisor;
            temp.push(this.rotatePoint(p.slice(), { phi, d0, d1 }));
          }
        }
        planes[d0] = temp;
      }
    }

    return planes.reduce((points, plane) => points.concat(plane), []);
  }

  one(d: number) {
    return Sphere.one(d, this.dimension);
  }

  static one(d: number, dimension: number) {
    const p = new Array(dimension).fill(0);
    p[d] = 1;
    return p;
  }

  rotatePoint(p: number[], theta: { phi: number; d0: number; d1: number }) {
    const { phi, d0, d1 } = theta;
    const v = [p[d0], p[d1]];
    const R = matrix([
      [this.f0(phi), -this.f1(phi)],
      [this.f1(phi), this.f0(phi)]
    ]);
    const u = multiply(R, v).valueOf();
    p[d0] = round(u[0], 5) as number;
    p[d1] = round(u[1], 5) as number;
    return p;
  }
}
