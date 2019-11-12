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
  norm = (r, phi) => r * Math.cos(phi);

  constructor(readonly dimension: number, readonly order: number) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }
    this.phi = Sphere.phi(order);
  }

  compute(theta: number[]): number[] {
    this.cos = Sphere.cos(this.phi, theta);
    this.sin = Sphere.sin(this.phi, theta);

    switch (this.dimension) {
      case 0:
        return this.sphere0(theta);
      case 1:
        return this.sphere1(theta);
      case 2:
        return this.sphere2(theta);
      default:
        return this.sphereN(this.dimension, theta);
    }
  }

  sphere0(theta: number[]) {
    return [this.cos[0][0]];
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
    let circle = this.sphere2(theta);
    let points = [];

    for (let d = 2; d < dimension; d++) {
      points = [];
      for (let phi = 0; phi < this.order; phi++) {
        for (let offset = 0; offset < circle.length; offset += d) {
          const p = circle
            .slice(offset, offset + d)
            .map(r =>
              this.norm(r, PI / 2 + (PI2 * phi) / this.order + theta[d]),
            );

          points.push(p[0]);
          points.push(this.sin[phi][d]);
          points.push(...p.slice(1));
        }
      }
      circle = points;
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
