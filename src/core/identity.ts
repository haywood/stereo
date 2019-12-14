import { Fn } from "./fn";
import Cube from "./cube";
import { Vector } from "./data";

export class Identity implements Fn {
    readonly domain: number;

    constructor(readonly d: number) {
        this.domain = d;
    }

    fn = (x: Vector, y: Vector = x.slice()) => y;

    sample = function* (n: number) {
        throw new Error('identity function does not support sampling');
    };
}
