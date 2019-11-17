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
  identity,
  matrix,
  multiply,
  abs,
  MathType,
  clone,
  flatten
} from "mathjs";

export default class Sphere {
  private readonly points = [];
  private readonly f0s = [];
  private readonly f1s = [];

  constructor(
    readonly dimension: number,
    readonly order: number,
    private readonly f0,
    private readonly f1
  ) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
    for (let o = 0; o < order; o++) {
      const phi = (pi * o) / order;
      this.f0s[o] = this.f0(phi);
      this.f1s[o] = this.f1(phi);
    }
    this.points = this.generatePoints();
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
    return this.vertices.map(x => (x + 1) / 2);
  }

  rotate(theta?: { value: number; d0: number; d1: number }) {
    const { points, dimension } = this;

    if (dimension < 2) return;

    if (theta) {
      for (const p of points) {
        this.rotatePoint(p, theta);
      }
    }

    return points.map(p => p.slice(0, 3));
  }

  generatePoints() {
    // generates 2 * 16 ** (dimension - 1) points
    const { dimension, order } = this;
    if (dimension < 1) return [];
    let seeds = [1, -1].map(x => {
      const p = new Array(dimension).fill(0);
      p[0] = x;
      return p;
    });
    let points = seeds.slice();

    for (let d = 1; d < dimension; d++) {
      points = [];
      for (const s of seeds) {
        for (let o = 0; o < order; o++) {
          const p = s.slice();
          this.rotatePointFast(p, { o, d0: 0, d1: d });
          points.push(p);
        }
      }
      seeds = points;
    }

    return points;
  }

  rotatePoint(p: number[], theta: { value: number; d0: number; d1: number }) {
    const { value: phi, d0, d1 } = theta;
    const v = [p[d0], p[d1]];
    const R = matrix([
      [this.f0(phi), -this.f1(phi)],
      [this.f1(phi), this.f0(phi)]
    ]);
    const u = multiply(R, v).valueOf();
    p[d0] = u[0];
    p[d1] = u[1];
  }

  rotatePointFast(p: number[], theta: { o: number; d0: number; d1: number }) {
    const { o, d0, d1 } = theta;
    const v = [p[d0], p[d1]];
    const R = matrix([
      [this.f0s[o], -this.f1s[o]],
      [this.f1s[o], this.f0s[o]]
    ]);
    const u = multiply(R, v).valueOf();
    p[d0] = u[0];
    p[d1] = u[1];
  }
}
