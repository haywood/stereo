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
  clone
} from "mathjs";

export default class Sphere {
  readonly points;
  private f0s = [];
  private f1s = [];
  f0 = cos;
  f1 = sin;

  constructor(readonly dimension: number, readonly order: number) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
    for (let o = 0; o < order; o++) {
      const phi = (pi * o) / order;
      this.f0s[o] = this.f0(phi);
      this.f1s[o] = this.f1(phi);
    }
    this.points = this.sphere(this.dimension, order);
  }

  rotate(theta?: { value: number; d0: number; d1: number }) {
    const points = clone(this.points);

    if (this.dimension < 3) {
      for (const p of points) {
        p.push(...new Array(3 - this.dimension).fill(0));
      }
    }

    if (theta) {
      for (const p of points) {
        this.rotatePoint(p, theta);
      }
    }

    return points.map(p => p.slice(0, 3));
  }

  sphere(dimension: number, order: number) {
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
