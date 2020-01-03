import { Scope, UnaryOperator, Link } from './types';
import { Value, PipeNode, StepNode, ArithNode, Scalar, NumberNode, AccessNode, FnNode } from "./ast";
import assert from 'assert';
import { pp } from '../pp';
import { Fn, CompositeFn } from '../fn/fn';
import Cube from '../fn/cube';
import Spiral from '../fn/spiral';
import Torus from '../fn/torus';
import FuckedUpTorus from '../fn/fucked_up_torus';
import Sphere from '../fn/sphere';
import Stereo from '../fn/stereo';
import Rotator from '../fn/rotator';
import Interval from '../fn/interval';
import { Identity } from '../fn/identity';

export type Resolution = {
    n: number;
    staticFn: CompositeFn;
    dynamicFn: CompositeFn;
};

export class Resolver {
    constructor(private readonly scope: Scope) { }

    resolve = (node: PipeNode | Scalar, extraScope: object = {}) => {
        switch (node.kind) {
            case 'pipe': return this.resolvePipe(node);
            case 'number': return node.value;
            case 'fn': return this.resolveFn(node, extraScope);
            case 'access': return this.resolveAccess(node, extraScope);
            case 'id': return this.resolveIdToNumber(node.id, extraScope);
            case 'arith': return this.resolveArith(node, extraScope);
        }
    };

    resolvePipe = (pipe: PipeNode): Resolution => {
        const chain = pipe.chain;
        const links: Link[] = [];
        const fun = chain.shift();
        const d = (fun.args.shift() as NumberNode).value;
        const link = this.resolveFirstStep(d, fun);
        const n = Interval.n(link.fn.domain, pipe.n);

        links.push(link);

        for (let i = 0; i < chain.length; i++) {
            const fun = chain[i];
            const link = this.resolveStep(links[i].fn, fun);
            links.push(link);
        }

        const [staticFn, dynamicFn] = this.buildComposites(links);
        return { n, staticFn, dynamicFn };
    };

    private buildComposites = (links: Link[]) => {
        let builder = new CompositeFn.Builder();
        while (links.length && !links[0].isDynamic) {
            builder.add(links.shift().fn);
        }

        const init = builder.build();
        builder = new CompositeFn.Builder().add(new Identity(init.d));

        while (links.length) {
            builder.add(links.shift().fn);
        }

        const iter = builder.build();
        return [init, iter];
    };

    private resolveFirstStep = (d: number, { type, args }: StepNode) => {
        const fn = funs[type](d, ...args.map(a => this.resolveScalar(a)));
        const isDynamic = args.some(isNodeDynamic);

        return { fn, isDynamic };
    };

    private resolveStep = (prev: Fn, { type, args }: StepNode): Link => {
        const d = ranges[type](prev.d);
        const fn = funs[type](d, ...args.map(a => this.resolveScalar(a)));
        const isDynamic = args.some(isNodeDynamic);

        return { fn, isDynamic };
    };

    private resolveScalar = (arg: Scalar, extraScope: object = {}): Value => {
        switch (arg.kind) {
            case 'number': return arg.value;
            case 'fn': return this.resolveFn(arg, extraScope);
            case 'access': return this.resolveAccess(arg, extraScope);
            case 'id': return this.resolveId(arg.id, extraScope);
            case 'arith': return this.resolveArith(arg, extraScope);
        }
    };

    private resolveFn = ({ name, args }: FnNode, extraScope: object): number => {
        const fn = Math[name];
        assert(typeof fn === 'function', `Expected ${name} to be a Math function in ${pp({ name, args })}`);
        return fn(...args.map(a => this.resolveScalar(a, extraScope)));
    };

    private resolveAccess = ({ id, index }: AccessNode, extraScope: object): number => {
        const scope = { ...this.scope, ...extraScope };
        const target = scope[id];
        assert(target, `Unable to resolve ${id} in scope ${pp(scope, 2)}`);
        return target[this.resolveScalar(index, extraScope) as number];
    };

    private resolveId = (id: string, extraScope: object): Value => {
        if (id in Math && typeof Math[id] === 'function') {
            return Math[id];
        } else {
            return this.resolveIdToNumber(id, extraScope);
        }
    };

    private resolveIdToNumber = (id: string, extraScope: object): number => {
        const idu = id.toUpperCase();
        if (id in extraScope) {
            return extraScope[id];
        } else if (id in this.scope) {
            return this.scope[id];
        } else if (idu in Math && typeof Math[idu] === 'number') {
            return Math[idu];
        } else {
            assert.fail(`unable to resolve id ${id} in scope ${pp({ ...this.scope, ...extraScope }, 2)}`);
        }
    };

    private resolveArith = ({ op, operands }: ArithNode, extraScope: object) => {
        const [a, b] = operands.map(a => this.resolveScalar(a, extraScope));
        if (typeof a === 'number' && typeof b === 'number') {
            return ops[op](a, b);
        }
        assert.fail(`One or more arithmetic operands evaluate to a non-number in ${pp({ op, operands }, 2)}`);

    };
}

const isNodeDynamic = (node: Scalar): boolean => {
    switch (node.kind) {
        case 'fn': return node.args.some(isNodeDynamic);
        case 'id': return ['t', 'power', 'chroma', 'onset'].includes(node.id);
        case 'arith': return node.operands.some(isNodeDynamic);
        default: return false;
    }
};

const ops: {
    [op: string]: (a: number, b: number) => number;
} = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '**': (a, b) => a ** b,
    '^': (a, b) => a ** b,
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

const funs: {
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
    r: rotate,
    stereo: (d, to) => new Stereo(d, to),
};

type Funs = typeof funs;

type Ranges = {
    [P in keyof Funs]: (domain: number) => number;
};

const ranges: Ranges = {
    cube: (domain) => domain,
    sphere: (domain) => domain + 1,
    spiral: (domain) => domain + 1,
    torus: (domain) => domain + 1,
    fucked_up_torus: (domain) => domain + 1,
    rotate: (domain) => domain,
    r: (domain) => domain,
    stereo: (domain) => domain,
};
