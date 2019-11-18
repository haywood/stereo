import { flatten } from "mathjs";

export default class GeometryHelper {
  static vertices(points, dimension: number) {
    if (dimension < 3) {
      points = points.map(p => [...p, ...new Array(3 - dimension).fill(0)]);
    } else if (dimension > 3) {
      points = points.map(p => p.slice(0, 3));
    }
    return flatten(points).valueOf() as number[];
  }

  static colors(vertices) {
    return vertices.map(x => (x + 1) / 2);
  }
}
