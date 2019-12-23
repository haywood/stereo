import { CompositeFn } from "../fn/fn";
import { CompiledAST, Scope, HL, Chunk } from "./types";
import { Data, Vector } from "../data";
import { pp } from "../pp";
import { getLogger } from "loglevel";
import { round } from "mathjs";
import assert from 'assert';
import { Color } from "three";

const logger = getLogger('Evaluator');

export class Evaluator {
    private readonly n: number;
    private readonly init: CompositeFn;
    private readonly iter: CompositeFn;
    private readonly offset: number;
    private readonly limit: number;

    constructor(
        private readonly scope: Scope,
        ast: CompiledAST,
        private readonly hl: HL,
        chunk?: Chunk,
    ) {
        const { n, init, iter } = ast;
        const offset = chunk?.offset || 0;
        const size = chunk?.size || n;
        const limit = offset + size;
        assert(offset >= 0, `offset must be non-negative; got ${offset}`);
        assert(limit <= n, `offset + size must be <= n; got ${offset} + ${size} = ${limit} > ${n}`);

        this.n = n;
        this.init = init;
        this.iter = iter;
        this.offset = offset;
        this.limit = limit;
    }


    private get d() {
        return this.iter.d;
    }

    initialize = (): SharedArrayBuffer => {
        const { n, init, iter } = this;
        const start = Date.now();
        const buffer = Data.bufferFor(n, init.d, iter.d);
        const data = new Float32Array(buffer);
        this.initData(data);
        logger.info(`initialization completed in ${Date.now() - start}ms`);
        return buffer;
    };

    iterate = (buffer: SharedArrayBuffer): SharedArrayBuffer => {
        this.iterData(new Float32Array(buffer));

        return buffer;
    };

    private initData = (data: Vector) => {
        const { n, init, offset, limit } = this;
        const input = Data.input(data);
        let i = this.offset;
        for (const y of init.sample(n, offset, limit)) {
            Data.set(input, y, i++, init.d);
        }
    };

    private iterData = (data: Vector) => {
        const { init, iter, scope, n, offset, limit } = this;
        const input = Data.input(data);
        const position = Data.position(data);
        const start = Date.now();

        assert.equal(data[Data.nOffset], n, `n(data) != n(evaluator)`);
        assert.equal(data[Data.inputOffset], init.d, `d0(data) != d0(evaluator)`);
        assert.equal(data[Data.positionOffset(data)], iter.d, 'd(data) != d(evaluator)');

        logger.debug(`iterating using ${pp(scope)}, ${pp(iter)}`);
        for (let i = offset; i < limit; i++) {
            iter.fn(Data.get(input, i, init.d), Data.get(position, i, iter.d));
        }

        this.computeColors(data);

        logger.debug(`iteration complete in ${Date.now() - start}ms`);
    };

    private computeColors = (data: Vector) => {
        logger.debug(`computing colors`);
        const { d, scope, hl, n, offset, limit } = this;
        const position = Data.position(data);
        const color = Data.color(data);

        for (let i = offset; i < limit; i++) {
            const p = Data.get(position, i, d);
            const colorScope = { ...scope, p, i };
            const hue = round(hl.h.evaluate(colorScope), 0);
            const lightness = round(hl.l.evaluate(colorScope), 0);
            const c = new Color(`hsl(${hue}, 100%, ${lightness}%)`);

            Data.set(color, [c.r, c.g, c.b], i, 3);
        }

    };
}
