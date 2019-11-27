import { flatten } from "mathjs";
import { pi, floor } from "mathjs";
import { cos } from "../lib/fn";

export default class GeometryHelper {
  static vertices(points) {
    return flatten(points).valueOf() as number[];
  }

  static colors(vertices) {
    return vertices.map(this.fn);
  }

  static fn = x => x ** 2;
  //static fn = x => 1;
}
