import Sphere from "./sphere";
import { FancyNumber, components } from "./fancy_number";
import { cos, sin } from "./fn";

export default class FancyNumberSphereGenerator {
  private _points;

  constructor(n: number, readonly d: number) {
    this._points = new Sphere(1, d).sample(n).map(FancyNumber.of);
  }

  get points() {
    return this._points.map(p => p.vector.slice(0, this.d));
  }

  rotate = rotation => {
    const { phi, d0, d1 } = rotation;
    let q = new FancyNumber({});
    q = q.add(
      new FancyNumber({
        [components[d0]]: cos(phi)
      })
    );
    q = q.add(
      new FancyNumber({
        [components[d1]]: sin(phi)
      })
    );
    this._points = this._points.map(q.mul);
  };
}
