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

const logger = getLogger('Pipe');
logger.setLevel('info');
const pp = (a: any, p: number = 2) => JSON.stringify(a, null, p);

export class Pipe {
    constructor(readonly n: number, readonly init: CompositeFn, readonly iter: CompositeFn) { }

    static parse = (spec: string, scope: Scope): { n: number, init: CompositeFn, iter: CompositeFn } => {
        const ast: AST = parseAndEvaluateScalars(spec, scope);
        const init = createInit(ast, scope);
        const iter = createIter(init, ast, scope);

        logger.debug(`processed ast into composites ${pp({ init, iter }, 2)}`);

        return new Pipe(ast.n, init, iter);
    }
}

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
}

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
}

const isStatic = ({ args }: Function) => args.every(a => a.id !== 't');

const parseAndEvaluateScalars = (spec: string, scope: Scope) => {
    const ast: AST = parse(spec);
    logger.debug(`parsed params into ast:\n${pp(ast, 2)}`);
    for (const { args } of ast.chain) {
        for (const a of args) {
            a.value = evaluateScalar(a, scope);
        }
    }
    logger.debug(`ast with evaluated scalars is\n${pp(ast, 2)}`)
    return ast;
}

const evaluateFirstFunction = ({ op, args }: Function, scope: Scope) => {
    const d = args.shift();
    return evaluateFunction(d.value, { op, args }, scope);
}

const evaluateFunction = (d: number, node: Function, scope: Scope) => {
    const expr = () => {
        return `${op}(${pp(args)})`
    }

    const { op, args } = node;
    if (!(op in fns)) {
        throw new Error(`unrecognized operation ${op} in expression ${expr()}`);
    }
    return fns[op](d, ...args.map(a => a.value), scope);
}

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
    n: number,
    t: number,
    f0: (x: number) => number,
    f1: (x: number) => number,
};

type AST = {
    n: number;
    chain: Function[]
};

type Function = {
    op?: string;
    args?: Scalar[]
};

type Scalar = {
    id?: string;
    value?: number;
}

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
    stereo: (d) => new Stereo(d, 3),
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
}