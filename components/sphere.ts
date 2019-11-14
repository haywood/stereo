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
  abs
} from "mathjs";

export default class Sphere {
  norm = (r, phi) => r * cos(phi);

  constructor(readonly dimension: number, readonly order: number) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
  }

  compute(theta: { value: number; d0: number; d1: number }) {
    return Sphere.sphere(this.dimension, this.order, theta);
  }

  static sphere(
    dimension: number,
    order: number,
    theta: { value: number; d0: number; d1: number }
  ) {
    if (dimension === 1) return [1, -1];

    const dimensions = Array.from(new Array(dimension).keys());
    const points = [];
    function* phis() {
      const increment = tau / 2 ** order;
      const limit = 2 ** order;
      for (let o = 0; o < limit; o++) {
        yield o * increment;
      }
    }

    // generate the shape by drawing a 2d circle in the plane formed by each
    // pair of dimensions
    for (let d0 = 0; d0 < dimension; d0++) {
      for (let d1 = 0; d1 < d0; d1++) {
        for (const phi of phis()) {
          const p = new Array(dimension).fill(0);
          p[d0] = cos(phi);
          p[d1] = sin(phi);
          points.push(p);
          console.log(d0, d1, phi, p);
        }
      }
    }
    console.log("--------end--------");

    // rotate the shape
    for (const p of points) {
      rotate(p, theta);
    }

    return points;
  }
}

const rotate = (p, theta) => {
  const { value: phi, d0, d1 } = theta;
  const v = [p[d0], p[d1]];
  const u = multiply(R(phi), v).valueOf();
  p[d0] = u[0];
  p[d1] = u[1];
};

const R = theta =>
  matrix([
    [cos(theta), -sin(theta)],
    [sin(theta), cos(theta)]
  ]);
