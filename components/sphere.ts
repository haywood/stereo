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
  flatten,
  multiply
} from "mathjs";

export default class Sphere {
  norm = (r, phi) => r * cos(phi);

  constructor(readonly dimension: number, readonly order: number) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
  }

  compute(theta: number): number[] {
    return flatten(
      Sphere.sphere(this.dimension, this.order, theta)
    ).valueOf() as number[];
  }

  static sphere(dimension: number, order: number, theta: number) {
    if (dimension === 1) return [cos(theta), cos(pi + theta)];
    const dimensions = Array.from(new Array(dimension).keys());
    const points = [];
    const used = [];
    for (let d0 = 0; d0 < dimension; d0++) {
      for (let d1 = 0; d1 < d0; d1++) {
        for (let phi = 0; phi < tau; phi += tau / order) {
          const p = new Array(dimension).fill(0);
          if (d0 === 0) {
            p[d0] = cos(phi);
            p[d1] = sin(phi);
          } else {
            p[d0] = cos(phi);
            p[d1] = sin(phi);
          }
          points.push(p);
          used.push(new Set([d0, d1]));
        }
      }
    }

    const pointCount = points.length;
    for (let i = 0; i < pointCount; i++) {
      const available = dimensions.filter(d => !used[i].has(d));
      if (available.length === 0) continue;

      const d0 = available[0];
      const p = points[i].slice();
      for (const d1 of used[i]) {
        const v = [p[d0], p[d1]];
        for (let phi = 0; phi < tau; phi += tau / order) {
          const u = multiply(R(phi), v).valueOf();
          const q = p.slice();
          q[d0] = u[0];
          q[d1] = u[1];
          points.push(q);
        }
      }
    }

    for (const p of points) {
      // TODO make rotation dimensions configurable
      const v = [p[0], p[2]];
      const u = multiply(R(theta), v).valueOf();
      p[0] = u[0];
      p[2] = u[1];
    }

    return points;
  }
}

const R = theta =>
  matrix([
    [cos(theta), -sin(theta)],
    [sin(theta), cos(theta)]
  ]);
