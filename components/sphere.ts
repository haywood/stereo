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
  f0 = cos;
  f1 = sin;

  constructor(readonly dimension: number, readonly order: number) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
  }

  compute(theta: { value: number; d0: number; d1: number }) {
    return this.sphere(this.dimension, this.order, theta);
  }

  sphere(
    dimension: number,
    order: number,
    theta: { value: number; d0: number; d1: number }
  ) {
    const dimensions = Array.from(new Array(dimension).keys());
    const increment = tau / 2 ** order;
    const points = [];
    function* phis() {
      const limit = 2 ** order;
      for (let o = 0; o < limit; o++) {
        yield o * increment;
      }
    }

    // generate the shape by drawing a 2d circle in the plane formed by each
    // pair of dimensions
    // TODO: make it stop generating duplicate points :/
    for (let d0 = 0; d0 < dimension; d0++) {
      for (let d1 = 0; d1 < d0; d1++) {
        for (const phi of phis()) {
          const p = new Array(dimension).fill(0);
          p[d0] = this.f0(phi);
          p[d1] = this.f1(phi);
          points.push(p);
          console.log(d0, d1, phi, p);
        }
      }
    }
    console.log("--------end--------");

    // rotate the shape
    if (dimension > 1) {
      for (const p of points) {
        rotate(p, theta);
      }
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
