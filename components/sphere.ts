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
import { norm, pi, tau, Matrix, identity, matrix, flatten } from "mathjs";

export default class Sphere {
  norm = (r, phi) => r * Math.cos(phi);

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
    if (dimension === 1) return [Math.cos(theta), Math.cos(pi + theta)];
    const units = identity(dimension).valueOf() as number[][];
    const points = [];
    for (let d0 = 0; d0 < dimension; d0++) {
      const e0 = units[d0];
      for (let d1 = 0; d1 < d0; d1++) {
        const e1 = units[d1];
        for (let phi = 0; phi < tau; phi += tau / order) {
          const p = new Array(dimension).fill(0);
          if (d0 === 0) {
            p[d0] = Math.cos(phi);
            p[d1] = Math.sin(phi);
          } else {
            p[d0] = Math.cos(phi + theta);
            p[d1] = Math.sin(phi + theta);
          }
          points.push(p);
        }
      }
    }
    //points.forEach(p => {
    //console.log(norm(p), p);
    //});
    return points;
  }
}
