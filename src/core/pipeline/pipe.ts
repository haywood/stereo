import { parse } from 'pegjs-loader!./grammar.pegjs';
import Sphere from '../sphere';
import { CompositeFn } from '../fn';
import Spiral from '../spiral';
import Torus from '../torus';
import FuckedUpTorus from '../fucked_up_torus';
import * as math from 'mathjs';
import Rotator from '../rotator';
import Stereo from '../stereo';
import { getLogger } from 'loglevel';
import Cube from '../cube';
import { Identity } from '../identity';
import Interval from '../interval';
import { Data, Vector } from '../data';
import { Color, TypedArray } from 'three';
import assert from 'assert';

const logger = getLogger('Pipe');
logger.setLevel('info');
const pp = (a: any, p: number = 2) => JSON.stringify(a, null, p);

export type Params = {
    pipe?: string;
    rate?: string;
    f0?: string;
    f1?: string;
    h?: string;
    l?: string;
    t?: number;
};

export class Pipe {
    constructor(
        readonly params: Params,
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

    static parse = (params: Params): Pipe => {
        const rate = math.evaluate(params.rate);
        const t = rate * params.t / 1000;
        const f0 = rotationBasis(params.f0);
        const f1 = rotationBasis(params.f1);
        const scope = { t, f0, f1 };

        const ast: AST = parseAndEvaluateScalars(params.pipe, scope);
        const init = createInit(ast, scope);
        const iter = createIter(init, ast, scope);
        ast.n = Interval.n(init.domain, ast.n);

        logger.debug(`processed ast into composites ${pp({ init, iter }, 2)}`);

        return new Pipe(params, ast.n, init, iter);
    };

    initData = (data: Float32Array) => {
        const { n, init, iter } = this;
        const start = Date.now();
        data[Data.nOffset] = n;
        data[Data.inputOffset] = init.d;
        data[Data.positionOffset(data)] = iter.d;
        logger.info(`initialized buffer to n[${data[Data.nOffset]}], d0[${data[Data.inputOffset]}], d[${data[Data.positionOffset(data)]}]`);

        logger.debug(`initializing input using ${n}, ${pp(init)}`);
        const input = Data.input(data);
        let i = 0;
        for (const p of init.sample(n)) {
            set(input, p, i++, init.d);
        }
        logger.info(`initialization completed in ${Date.now() - start}ms`);
    };

    iterData = (data: Float32Array) => {
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
            const x = get(input, i, init.d);
            const y = iter.fn(x);
            set(position, y, i, iter.d);
        }

        const lightnessFn = math.compile(`100 * (${params.l})`);
        const hueFn = math.compile(`360 * (${params.h})`);
        const rate = math.evaluate(params.rate);
        const seconds = rate * params.t / 1000;

        logger.debug(`computing colors`);
        for (let i = 0; i < n; i++) {
            const p = get(position, i, iter.d);
            const colorScope = { t: seconds, p, i, n };
            const hue = math.round(hueFn.evaluate(colorScope), 0);
            const lightness = math.round(lightnessFn.evaluate(colorScope), 0);
            const c = new Color(`hsl(${hue}, 100%, ${lightness}%)`);
            set(color, [c.r, c.g, c.b], i, 3);
        }

        logger.debug(`iteration complete in ${Date.now() - start}ms`);
    };
}

const get = (arr: Float32Array, i: number, stride: number) => {
    const offset = i * stride;
    return arr.subarray(offset, offset + stride);
};

const set = (arr: Float32Array, value: Vector, i: number, stride: number) => {
    assert(value.length <= stride);
    const offset = i * stride;
    logger.debug(`setting arr[${i}, stride=${stride}] to ${value}`);
    logger.debug(`arr is length ${arr.length}`);
    return arr.set(value, offset);
};

const rotationBasis = (expr: string): (x: number) => number => {
    const fnc = math.compile(expr);
    return (phi: number) => fnc.evaluate({ phi });
};

const createInit = ({ chain }: AST, scope: Scope) => {
    const init = new CompositeFn.Builder();
    init.add(evaluateFirstFunction(chain.shift(), scope));

    while (chain.length && isStatic(chain[0])) {
        const { op, args } = chain.shift();
        const d = ranges[op](init.d);
        logger.debug(`adding new ${op} of dimension ${d} to composite`);
        const fn = evaluateFunction(d, { op, args }, scope);
        init.add(fn);
    }

    return init.build();
};

const createIter = (init: CompositeFn, { chain }: AST, scope: Scope) => {
    const iter = new CompositeFn.Builder();
    iter.add(new Identity(init.d));

    for (let { op, args } of chain) {
        const d = ranges[op](iter.d);
        logger.debug(`adding new ${op} of dimension ${d} to composite`);
        const fn = evaluateFunction(d, { op, args }, scope);
        iter.add(fn);
    }

    return iter.build();
};

const isStatic = ({ args }: Function) => args.every(a => a.id !== 't');

const parseAndEvaluateScalars = (spec: string, scope: Scope) => {
    const ast: AST = parse(spec);
    logger.debug(`parsed params into ast:\n${pp(ast, 2)}`);
    for (const { args } of ast.chain) {
        for (const a of args) {
            a.value = evaluateScalar(a, scope);
        }
    }
    logger.debug(`ast with evaluated scalars is\n${pp(ast, 2)}`);
    return ast;
};

const evaluateFirstFunction = ({ op, args }: Function, scope: Scope) => {
    const d = args.shift();
    return evaluateFunction(d.value, { op, args }, scope);
};

const evaluateFunction = (d: number, node: Function, scope: Scope) => {
    const expr = () => {
        return `${op}(${pp(args)})`;
    };

    const { op, args } = node;
    if (!(op in fns)) {
        throw new Error(`unrecognized operation ${op} in expression ${expr()}`);
    }
    return fns[op](d, ...args.map(a => a.value), scope);
};

const evaluateScalar = (scalar: Scalar, scope: any): any => {
    if (scalar.value != null) {
        return scalar.value;
    } else if (scalar.id != null) {
        try {
            return math.evaluate(scalar.id, scope);
        } catch (err) {
            throw new Error(`failed to evaluate ${scalar.id} in scope ${pp(scope)} ${err.message}`);
        }
    }
};
type Scope = {
    t: number,
    f0: (x: number) => number,
    f1: (x: number) => number,
};

type AST = {
    n: number;
    chain: Function[];
};

type Function = {
    op?: string;
    args?: Scalar[];
};

type Scalar = {
    id?: string;
    value?: number;
};

const rotate = (d, phi: number, d0: number, d1: number, { f0, f1 }: Scope) =>
    new Rotator(d, [{ phi, d0, d1 }], f0, f1);

const fns = {
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
