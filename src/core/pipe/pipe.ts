import { parse } from 'pegjs-loader!./grammar.pegjs';
import Sphere from '../fn/sphere';
import { CompositeFn, cos, sin } from '../fn/fn';
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

const logger = getLogger('Pipe');
logger.setLevel('info');

export type Params = {
    pipe: string;
    theta?: string;
    h?: string;
    l?: string;
    t?: number;
    bpm?: number;
    ebeat?: number;
};

type UnaryOperator = (x: number) => number;

export type CompiledParams = {
    pipe: AST;
    h: math.EvalFunction;
    l: math.EvalFunction;
    scope: Scope;
};

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

    static parse = (params: Params): Pipe => Pipe.build(Pipe.compileParams(params));

    static compileParams = (params: Params): CompiledParams => {
        const bpm = params.bpm || 0;
        const ebeat = params.ebeat;
        const t = (params.t || 0) / 1000;
        const h = math.compile(`360 * (${params.h || 1})`);
        const l = math.compile(`100 * (${params.l || 0.5})`);
        const scope: Scope = { t, bpm, ebeat };
        const theta = math.evaluate(params.theta || 'pi * t', scope);
        scope.theta = theta;

        return {
            pipe: parseAndEvaluateScalars(params.pipe, scope),
            h,
            l,
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

        const { h, l } = params;
        logger.debug(`computing colors`);
        for (let i = 0; i < n; i++) {
            const p = get(position, i, iter.d);
            const colorScope = { ...params.scope, p, i };
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

    while (chain.length && isStatic(chain[0])) {
        const { op, args } = chain.shift();
        const d = ranges[op](init.d);
        logger.debug(`adding new ${op} of dimension ${d} to composite`);
        const fn = evaluateFunctionCall(d, { op, args });
        init.add(fn);
    }

    return init.build();
};

const createIter = (init: CompositeFn, { pipe, scope }: CompiledParams) => {
    const iter = new CompositeFn.Builder();
    iter.add(new Identity(init.d));
    const { chain } = pipe;

    for (const { op, args } of chain) {
        const d = ranges[op](iter.d);
        logger.debug(`adding new ${op} of dimension ${d} to composite`);
        const fn = evaluateFunctionCall(d, { op, args });
        iter.add(fn);
    }

    return iter.build();
};

const isStatic = ({ args }: FunctionCall) => args.every(a => a.id !== 't');

const parseAndEvaluateScalars = (spec: string, scope: Scope): AST => {
    const ast: AST = parse(spec);
    logger.debug(`parsed params into ast:\n${pp(ast, 2)}`);
    for (const { args } of ast.chain) {
        for (const a of args) {
            a.value = evaluateScalar(a, scope);
        }
    }
    logger.debug(`ast with evaluated scalars in scope ${pp(scope)} is\n${pp(ast)}`);
    return ast;
};

const evaluateFirstFunctionCall = ({ op, args }: FunctionCall) => {
    const d = args.shift();
    return evaluateFunctionCall(d.value as number, { op, args });
};

const evaluateFunctionCall = (d: number, node: FunctionCall) => {
    const { op, args } = node;
    const fn = fns[op];
    assert(op, `unrecognized operation ${op} in expression ${op}(${pp(args)})`);
    return fn(d, ...args.map(a => a.value));
};

const evaluateScalar = (scalar: Scalar, scope: any): any => {
    const id = scalar.id;
    if (scalar.value != null) {
        return scalar.value;
    } else if (id === null) {
        throw new Error(`found invalid scalar with neight id nor value set`);
    } else if (id in Math) {
        return (phi: number) => Math[id](phi);
    } else {
        try {
            return math.evaluate(id, scope);
        } catch (err) {
            throw new Error(`failed to evaluate ${scalar.id} in scope ${pp(scope)} ${err.message}`);
        }
    }
};
type Scope = {
    t: number;
    bpm: number;
    ebeat: number;
    n?: number;
    theta?: number;
};

type AST = {
    n: number;
    chain: FunctionCall[];
};

type FunctionCall = {
    op?: string;
    args?: Scalar[];
};

type Scalar = {
    id?: string;
    value?: number | Function;
};

const rotate = (d: number, theta: number, d0: number, d1: number, f0?: UnaryOperator, f1?: UnaryOperator) => {
    return new Rotator(d, theta, d0, d1, f0 || Math.cos, f1 || Math.sin);
};

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
