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
  Mesh,
} from "three";

const PI = Math.PI;
const PI2 = 2 * PI;

export default class Sphere {
  readonly phi: number[];
  private cos: number[][];
  private sin: number[][];

  constructor(readonly dimension: number, readonly order: number) {
    this.phi = Sphere.phi(order);
  }

  compute(theta: number[]): number[] {
    this.cos = Sphere.cos(this.phi, theta);
    this.sin = Sphere.sin(this.phi, theta);

    return this.recur(this.dimension, theta);
  }

  recur(dimension: number, theta: number[]): number[] {
    if (dimension < 0) {
      throw new Error(`invalid dimension: ${dimension}`);
    } else if (dimension === 0) {
      return this.sphere0(theta);
    } else if (dimension === 1) {
      return this.sphere1(theta);
    } else if (dimension === 2) {
      return this.sphere2(theta);
    } else {
      return this.sphereN(this.dimension, theta);
    }
  }

  sphere0(theta: number[]) {
    return [Math.cos(this.phi[0]) + theta[0]];
  }

  sphere1(theta: number[]) {
    const points = [];
    for (let phi = 0; phi < this.order; phi++) {
      points.push(this.cos[phi][0]);
    }
    return points;
  }

  sphere2(theta: number[]) {
    const points = [];
    for (let phi = 0; phi < this.order; phi++) {
      points.push(this.cos[phi][0], this.sin[phi][1]);
    }
    return points;
  }

  sphereN(dimension: number, theta: number[]) {
    const circle = this.recur(dimension - 1, theta);
    const points = [];

    for (let phi = 0; phi < this.order; phi++) {
      for (let offset = 0; offset < circle.length; offset += dimension - 1) {
        const p = circle
          .slice(offset, offset + dimension - 1)
          .map(q => q * this.cos[phi][dimension - 1]);

        points.push(p[0]);
        points.push(this.sin[phi][dimension - 1]);
        points.push(...p.slice(1));
      }
    }

    return points;
  }

  private static phi(order: number): number[] {
    const result = [];
    for (let o = 0; o <= order; o++) {
      // Starting at pi / 2 instead of 0 allows us to get the points at y = {1,-1}
      // (i.e. the top and bottom in R3)
      result.push(PI / 2 + (o / order) * PI2);
    }
    return result;
  }

  private static cos(phi: number[], theta: number[]): number[][] {
    return phi.map(phi => theta.map(theta => Math.cos(phi + theta)));
  }

  private static sin(phi: number[], theta: number[]): number[][] {
    return phi.map(phi => theta.map(theta => Math.sin(phi + theta)));
  }
}
