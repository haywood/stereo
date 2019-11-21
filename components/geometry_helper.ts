import { flatten } from "mathjs";

export default class GeometryHelper {
  static vertices(points) {
    return flatten(
points      
    ).valueOf() as number[];
  }

  static colors(vertices) {
    return vertices.map(x => (x + 1) / 2);
  }
}
