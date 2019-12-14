import Sphere from "./sphere";
import { norm, equal } from "mathjs";

describe("Sphere", () => {
  describe("d=2", () => {
    it("generates a circle with 4 points", () => {
      const points = sphere(2, 1, 4);

      expect(
        equal(Array.from(points), [
          [-1, 0],
          [0, -1],
          [1, 0],
          [0, 1]
        ])
      ).toBeTruthy();
    });

    it("generates a circle with 10 points", () => {
      const points = sphere(2, 1, 10);

      expect(points).toMatchSnapshot();
    });
  });

  describe("d=3", () => {
    it("generates a sphere with 4 points", () => {
      const points = sphere(3, 1, 4);

      for (const p of points) {
        expect(norm(p)).toBeLessThanOrEqual(1);
      }

      expect(
        equal(Array.from(points), [
          [-1, 0, 0],
          [-1, 0, 0],
          [0, -1, 0],
          [1, 0, 0]
        ])
      ).toBeTruthy();
    });

    it("generates a sphere with 9 points", () => {
      const points = sphere(3, 1, 9);


      for (const p of points) {
        expect(norm(p)).toBeCloseTo(1, 10);
      }
      expect(points).toMatchSnapshot();
    });

    it("generates a sphere with 100 points", () => {
      const points = sphere(3, 1, 100);


      for (const p of points) {
        expect(norm(p)).toBeCloseTo(1, 10);
      }
      expect(points).toMatchSnapshot();
    });
  });

  function sphere(d, r, n) {
    return Array.from(new Sphere(d, r).sample(n));
  }
});
