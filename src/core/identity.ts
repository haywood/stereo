import { Fn } from "./fn";
import Cube from "./cube";
import { Vector } from "./data";
import assert from 'assert';

export class Identity implements Fn {
    readonly domain: number;

    constructor(readonly d: number) {
        this.domain = d;
    }

    fn = (x: Vector, y: Vector = new Float32Array(this.d)) => {
        const { d } = this;
        assert.equal(x.length, d);
        assert.equal(y.length, d);
        for (let i = 0; i < d; i++) {
            y[i] = x[i];
        }
        return y;
    };

    sample = function* (n: number) {
        throw new Error('identity function does not support sampling');
    };
}
