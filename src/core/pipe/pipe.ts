import Sphere from '../fn/sphere';
import { CompositeFn, cos, sin, Fn } from '../fn/fn';
import Spiral from '../fn/spiral';
import Torus from '../fn/torus';
import FuckedUpTorus from '../fn/fucked_up_torus';
import * as math from 'mathjs';
import Rotator from '../fn/rotator';
import Stereo from '../fn/stereo';
import { getLogger } from 'loglevel';
import Cube from '../fn/cube';
import { Identity } from '../fn/identity';
import Interval from '../fn/interval';
import { Data, Vector } from '../data';
import { Color } from 'three';
import assert from 'assert';
import { pp } from '../pp';
import { CompiledParams, Params, Scope, UnaryOperator, SimplifiedAST, SimplifiedFunctionCall } from './types';
import { Compiler } from './compiler';

const logger = getLogger('Pipe');
logger.setLevel('info');

export class Pipe {
    constructor(
        readonly params: CompiledParams,
        readonly n: number,
        readonly init: CompositeFn,
        readonly iter: CompositeFn,
    ) {
        assert.equal(init.d, iter.domain);
    }

    static run = (params: Params, buffer: ArrayBuffer) => {
        const pipe = Pipe.parse(params);
        const data = new Float32Array(buffer);
        if (data[Data.nOffset] === 0) {
            logger.warn(`buffer for ${pp(params)} is empty. initializing.`);
            pipe.initData(data);
        }
        pipe.iterData(data);
    };

    static parse = (params: Params): Pipe =>
        Pipe.build(Pipe.compileParams(params));

    static compileParams = (params: Params): CompiledParams => {
        const bpm = params.bpm || 0;
        const ebeat = params.ebeat;
        const t = (params.t || 0) / 1000;
        const h = math.compile(`360 * (${params.h || 1})`);
        const l = math.compile(`100 * (${params.l || 0.5})`);
        const theta = params.theta = params.theta || 't';
        const scope: Scope = { t, bpm, ebeat };

        return {
            pipe: parseAndEvaluateFunctionArgs(params, scope),
            h,
            l,
            theta,
            scope,
        };
    };

    private static build = (params: CompiledParams) => {
        const { pipe } = params;
        const init = createInit(params);
        // TODO compute true n in compileParams
        pipe.n = Interval.n(init.domain, pipe.n);
        params.scope.n = pipe.n;
        const iter = createIter(init, params);

        logger.debug(`processed ast into composites ${pp({ init, iter }, 2)}`);

        return new Pipe(params, pipe.n, init, iter);
    };

    initData = (data: Vector) => {
        const { n, init, iter } = this;
        const start = Date.now();
        data[Data.nOffset] = n;
        data[Data.inputOffset] = init.d;
        data[Data.positionOffset(data)] = iter.d;
        logger.info(`initialized buffer to n[${data[Data.nOffset]}], d0[${data[Data.inputOffset]}], d[${data[Data.positionOffset(data)]}]`);

        logger.debug(`initializing input using ${n}, ${pp(init)}`);
        const input = Data.input(data);
        let i = 0;
        for (const y of init.sample(n)) {
            set(input, y, i++, init.d);
        }
        logger.info(`initialization completed in ${Date.now() - start}ms`);
    };

    iterData = (data: Vector) => {
        const { init, iter, params, n } = this;
        const input = Data.input(data);
        const position = Data.position(data);
        const color = Data.color(data);
        const start = Date.now();

        assert.equal(data[Data.nOffset], n);
        assert.equal(data[Data.inputOffset], init.d);
        assert.equal(data[Data.positionOffset(data)], iter.d);

        logger.debug(`iterating using ${pp(params)}, ${pp(iter)}`);
        for (let i = 0; i < n; i++) {
            iter.fn(get(input, i, init.d), get(position, i, iter.d));
        }

        const { h, l, theta } = params;
        logger.debug(`computing colors`);
        for (let i = 0; i < n; i++) {
            const p = get(position, i, iter.d);
            const colorScope = { ...params.scope, p, i, theta };
            const hue = math.round(h.evaluate(colorScope), 0);
            const lightness = math.round(l.evaluate(colorScope), 0);
            const c = new Color(`hsl(${hue}, 100%, ${lightness}%)`);
            set(color, [c.r, c.g, c.b], i, 3);
        }

        logger.debug(`iteration complete in ${Date.now() - start}ms`);
    };
}

const get = (arr: Vector, i: number, stride: number) => {
    const offset = i * stride;
    return arr.subarray(offset, offset + stride);
};

const set = (arr: Vector, value: ArrayLike<number>, i: number, stride: number) => {
    assert(value.length <= stride);
    const offset = i * stride;
    logger.debug(`setting arr[${i}, stride=${stride}] to ${value}`);
    logger.debug(`arr is length ${arr.length}`);
    return arr.set(value, offset);
};

const createInit = ({ pipe, scope }: CompiledParams) => {
    const init = new CompositeFn.Builder();
    const { chain } = pipe;
    init.add(evaluateFirstFunctionCall(chain.shift()));

    while (chain.length && !chain[0].isTemporal) {
        const link = chain.shift();
        const { fn } = link;
        const d = ranges[fn](init.d);
        logger.debug(`adding new ${fn} of dimension ${d} to composite`);
        init.add(evaluateFunctionCall(d, link));
    }

    return init.build();
};

const createIter = (init: CompositeFn, { pipe, scope }: CompiledParams) => {
    const iter = new CompositeFn.Builder();
    iter.add(new Identity(init.d));
    const { chain } = pipe;

    for (const link of chain) {
        const { fn } = link;
        const d = ranges[fn](iter.d);
        logger.debug(`adding new ${fn} of dimension ${d} to composite`);
        iter.add(evaluateFunctionCall(d, link));
    }

    return iter.build();
};

const parseAndEvaluateFunctionArgs = (params: Params, scope: Scope): SimplifiedAST => {
    const ast = new Compiler(scope).compile(params);
    logger.debug(`parsed params into ast:\n${pp(ast, 2)}`);
    return ast;
};

const evaluateFirstFunctionCall = (call: SimplifiedFunctionCall) => {
    const d = call.args.shift();
    assert(typeof d === 'number', `Expected first argument of first function call to be a number representing its dimension.`);
    return evaluateFunctionCall(d as number, call);
};

const evaluateFunctionCall = (d: number, { fn, args }: SimplifiedFunctionCall) => {
    const factory = fns[fn];
    assert(factory, `unrecognized operation ${fn} in expression ${fn}(${pp(args)})`);
    return factory(d, ...args);
};

const rotate = (
    d: number,
    theta: number,
    d0: number,
    d1: number,
    f0: UnaryOperator = Math.cos,
    f1: UnaryOperator = Math.sin,
) => {
    return new Rotator(d, theta, d0, d1, f0, f1);
};

const fns: {
    [op: string]: (d: number, ...rest) => Fn;
} = {
    cube: (d, l) => new Cube(d, l),
    sphere: (d, r: number) => new Sphere(d, r),
    spiral: (d, a: number, k: number) =>
        new Spiral(d, new Array(d).fill(a), new Array(d - 1).fill(k)),
    torus: (d, r: number, t: number) => new Torus(d, r, t),
    fucked_up_torus: (d, r: number, t: number) =>
        new FuckedUpTorus(d, r, t),
    rotate,
    R: rotate,
    stereo: (d, to) => new Stereo(d, to),
};

type Fns = typeof fns;

type Ranges = {
    [P in keyof Fns]: (domain: number) => number;
};

const ranges: Ranges = {
    cube: (domain) => domain,
    sphere: (domain) => domain + 1,
    spiral: (domain) => domain + 1,
    torus: (domain) => domain + 1,
    fucked_up_torus: (domain) => domain + 1,
    rotate: (domain) => domain,
    R: (domain) => domain,
    stereo: (domain) => domain,
};
