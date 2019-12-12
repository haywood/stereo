import { Fn } from "./fn";
import Cube from "./cube";

export class Identity implements Fn {
    readonly domain: number;

    constructor(readonly d: number) {
        this.domain = d;
    }

    fn = (x: number[]): number[] => x;

    sample = function* (n: number) {
        throw new Error('identity function does not support sampling');
    }
}