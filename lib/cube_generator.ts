import Cube from "./cube";
import Rotator from "./rotator";

export default class CubeGenerator {
  readonly points;

  constructor(n: number, d: number) {
    this.points = new Cube(2, d).sample(n);
  }

  rotate = rotation => {
    const { phi, d0, d1 } = rotation;
    for (const p of this.points) {
      Rotator.rotatePoint(p, { phi, d0, d1 });
    }
  };
}
