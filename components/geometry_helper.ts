import { flatten } from "mathjs";
import { pi, floor, max, abs, min } from "mathjs";
import { cos } from "../lib/fn";

export default class GeometryHelper {
  static vertices(points) {
    return flatten(points).valueOf() as number[];
  }

  static colors(vertices) {
    return vertices.map(x => abs(x));
  }
}
