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
  subtract,
  clone,
  flatten,
  round
} from "mathjs";
import Projector from "./projector";
import HalveAndDouble from "./halve_and_double";
import LogSpiral from "./spiral";
import ArithmeticSpiral from "./arithmetic_spiral";

export default class Sphere {
  points;
  basePoints;
  private readonly f0s = [];
  private readonly f1s = [];

  constructor(
    private readonly dimension: number,
    private readonly order: number,
    private readonly f0,
    private readonly f1,
    private readonly mode: string
  ) {
    if (this.dimension < 0) {
      throw new Error(`invalid dimension: ${this.dimension}`);
    }

    this.basePoints = this.generatePoints();
    this.points = this.basePoints;
    console.log("generated points:", format(this.points));
  }

  rotate(theta: { phi: number; d0: number; d1: number }) {
    const points = [];
    if (this.dimension > 1) {
      for (const p of this.basePoints) {
        points.push(this.rotatePoint(p.slice(), theta));
      }
    }
    this.points = points;
  }

  generatePoints() {
    const { dimension, order, f0, f1, mode } = this;
    switch (mode) {
      case "halveAndDouble":
        return new HalveAndDouble(dimension, order, f0, f1).generatePoints();
      case "logSpiral":
        return this.generatePointsFromSpiral(
          phase => new LogSpiral(0.1, 1, phase)
        );
      case "arithmeticSpiral":
        return this.generatePointsFromSpiral(
          phase => new ArithmeticSpiral(0, 1, phase)
        );
    }
  }

  generatePointsFromSpiral(newSpiral) {
    const { dimension, order } = this;
    const pointCount = 2 ** order;
    const points = [];
    for (let phase = 0; phase < tau; phase += tau / 10) {
      const spiral = newSpiral(phase);
      points.push(...spiral.sample(pointCount / 10, -tau, tau));
    }
    return Projector.stereo(points, 2, dimension);
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
