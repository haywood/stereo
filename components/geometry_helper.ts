import Projector from "./projector";
import { flatten } from "mathjs";

export default class GeometryHelper {
  static vertices(points, dimension: number) {
    return flatten(
      Projector.stereo(points, dimension, 3)
    ).valueOf() as number[];
  }

  static colors(vertices) {
    return vertices.map(x => (x + 1) / 2);
  }
}
