import { CompositeFn } from "../fn/fn";
import { CompiledAST, Scope, HL } from "./types";
import { Identity } from "../fn/identity";
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

    constructor(
        private readonly scope: Scope,
        ast: CompiledAST,
        private readonly hl: HL,
    ) {
        this.n = ast.n;
        this.init = ast.init;
        this.iter = ast.iter;
    }


    private get d() {
        return this.iter.d;
    }

    evaluate = (buffer?: SharedArrayBuffer): SharedArrayBuffer => {
        if (!buffer) {
            buffer = this.initBuffer(buffer);
        }

        this.iterData(new Float32Array(buffer));

        return buffer;
    };

    private initBuffer = (buffer: SharedArrayBuffer): SharedArrayBuffer => {
        const { n, init, iter } = this;
        buffer = Data.bufferFor(n, init.d, iter.d);
        const data = new Float32Array(buffer);
        this.initData(data);
        return buffer;
    };

    private initData = (data: Vector) => {
        const { n, init, d } = this;
        const start = Date.now();
        data[Data.nOffset] = n;
        data[Data.inputOffset] = init.d;
        data[Data.positionOffset(data)] = d;
        const input = Data.input(data);
        let i = 0;
        for (const y of init.sample(n)) {
            Data.set(input, y, i++, init.d);
        }
        logger.info(`initialization completed in ${Date.now() - start}ms`);
    };

    private iterData = (data: Vector) => {
        const { init, iter, scope, n } = this;
        const input = Data.input(data);
        const position = Data.position(data);
        const start = Date.now();

        assert.equal(data[Data.nOffset], n, `n(data) != n(evaluator)`);
        assert.equal(data[Data.inputOffset], init.d, `d0(data) != d0(evaluator)`);
        assert.equal(data[Data.positionOffset(data)], iter.d, 'd(data) != d(evaluator)');

        logger.debug(`iterating using ${pp(scope)}, ${pp(iter)}`);
        for (let i = 0; i < n; i++) {
            iter.fn(Data.get(input, i, init.d), Data.get(position, i, iter.d));
        }

        this.computeColors(data);

        logger.debug(`iteration complete in ${Date.now() - start}ms`);
    };

    private computeColors = (data: Vector) => {
        logger.debug(`computing colors`);
        const { d, scope, hl, n } = this;
        const position = Data.position(data);
        const color = Data.color(data);

        for (let i = 0; i < n; i++) {
            const p = Data.get(position, i, d);
            const colorScope = { ...scope, p, i };
            const hue = round(hl.h.evaluate(colorScope), 0);
            const lightness = round(hl.l.evaluate(colorScope), 0);
            const c = new Color(`hsl(${hue}, 100%, ${lightness}%)`);

            Data.set(color, [c.r, c.g, c.b], i, 3);
        }

    };
}
