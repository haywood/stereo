import Cube from "./fn/cube";
import { tau, equal } from "mathjs";

describe("Cube", () => {
  describe("d=1", () => {
    it("generates a line with 4 points", () => {
      const points = cube(1, 2, 4);

      expect(equal(points, [[-1], [-0.5], [0], [0.5]])).toBeTruthy();
    });

    it("generates a line with 10 points", () => {
      const points = cube(1, 2, 10);

      expect(
        equal(points, [
          [-1],
          [-0.8],
          [-0.6],
          [-0.4],
          [-0.2],
          [0],
          [0.2],
          [0.4],
          [0.6],
          [0.8]
        ])
      ).toBeTruthy();
    });
  });

  describe("d=2", () => {
    it("generates a square with 4 points", () => {
      const points = cube(2, 2, 4);

      expect(
        equal(points, [
          [-1, -1],
          [-1, 0],
          [0, -1],
          [0, 0]
        ])
      ).toBeTruthy();
    });

    it("generates a square with 9 points", () => {
      const points = cube(2, 2, 9);

      expect(
        equal(points, [
          [-1, -1],
          [-0.33, -0.33],
          [-0.33, -1],
          [-0.33, 0.33],
          [-1, -0.33],
          [-1, 0.33],
          [0.33, -0.33],
          [0.33, -1],
          [0.33, 0.33]
        ])
      ).toBeTruthy();
    });
  });
});

function cube(d, l, n) {
  const p = Array.from(new Cube(d, l).sample(n));
  return p;
}
