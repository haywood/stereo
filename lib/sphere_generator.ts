import Sphere from "./sphere";
import Rotator from "./rotator";

export default class SphereGenerator {
  readonly points;

  constructor(n: number, d: number) {
    this.points = new Sphere(1, d).sample(n);
  }

  rotate = rotation => {
    const { phi, d0, d1 } = rotation;
    for (const p of this.points) {
      Rotator.rotatePoint(p, { phi, d0, d1 });
    }
  };
}
