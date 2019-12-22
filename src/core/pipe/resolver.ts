import { ASTNode } from './grammar.pegjs';
import { Scope, CompiledAST, Value, UnaryOperator, Link, ASTNode } from './types';
import assert from 'assert';
import { pp } from '../pp';
import { Fn } from '../fn/fn';
import Cube from '../fn/cube';
import Spiral from '../fn/spiral';
import Torus from '../fn/torus';
import FuckedUpTorus from '../fn/fucked_up_torus';
import Sphere from '../fn/sphere';
import Stereo from '../fn/stereo';
import Rotator from '../fn/rotator';
import Interval from '../fn/interval';

export class Resolver {
    constructor(private readonly scope: Scope) { }

    resolve = (pipe: ASTNode): CompiledAST => {
        return this.resolvePipeNode(pipe);
    };

    private resolvePipeNode = (pipe: ASTNode): CompiledAST => {
        const chain = assertDefInNode('chain', pipe);
        const links: Link[] = [];
        const fun = chain.shift();
        const d = fun.args.shift().value as number;
        const link = this.resolveFirstFunNode(d, fun);
        const n = Interval.n(link.fn.domain, assertNumberInNode('n', pipe));

        links.push(link);

        for (let i = 0; i < chain.length; i++) {
            const fun = chain[i];
            const link = this.resolveFunNode(links[i].fn, fun);
            links.push(link);
        }

        return { n, chain: links };
    };

    private resolveFirstFunNode = (d: number, fun: ASTNode) => {
        const name: string = assertDefInNode('fn', fun);
        const args = assertDefInNode('args', fun);
        const fn = funs[name](d, ...args.map(this.resolveFunArgNode));
        const isTemporal = args.some(isNodeTemporal);

        return { fn, isTemporal };
    };

    private resolveFunNode = (prev: Fn, fun: ASTNode): Link => {
        const name: string = assertDefInNode('fn', fun);
        const args = assertDefInNode('args', fun);
        const d = ranges[name](prev.d);
        const fn = funs[name](d, ...args.map(this.resolveFunArgNode));
        const isTemporal = args.some(isNodeTemporal);

        return { fn, isTemporal };
    };

    private resolveFunArgNode = (arg: ASTNode): Value => {
        if (arg.id) {
            return this.resolveVarNode(arg);
        } else {
            return this.resolveArithNode(arg);
        }
    };

    private resolveArithNode = (node: ASTNode): number => {
        if (node.op != null) {
            const op = ops[node.op];
            const [a, b] = assertDefInNode('operands', node)
                .map(this.resolveArithNode);
            const c = op(a, b);
            return c;
        } else {
            return this.resolveNumberNode(node);
        }
    };

    private resolveVarNode = (node: ASTNode): Value => {
        const { value } = node;
        if (typeof value === 'function') {
            return value;
        } else {
            return this.resolveNumberNode(node);
        }
    };

    private resolveNumberNode = (node: ASTNode): number => {
        const { value } = node;
        if (typeof value === 'number') {
            return value;
        } else {
            assert.fail(`don't know how to handle number node ${pp(node)}`);
        }
    };
}

const assertDefInNode = (name: string, node: ASTNode) => {
    const x = node[name];
    assertCondInNode(x != null, name, 'to be defined', node);
    return x;
};

const assertNumberInNode = (name: string, node: ASTNode): number => {
    const x = node[name];
    assertCondInNode(typeof x === 'number', name, 'a number', node);
    return x as number;
};

const assertCondInNode = (cond: boolean, name: string, expected: string, node: ASTNode) => {
    assert(cond, `Expected ${name} to be ${expected} in ${pp(node)}`);
};

const isNodeTemporal = (node: ASTNode): boolean => {
    if (node.id === 't') return true;
    else if (node.args) return node.args.some(isNodeTemporal);
    else if (node.operands) return node.operands.some(isNodeTemporal);
    else return false;
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
    R: rotate,
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
    R: (domain) => domain,
    stereo: (domain) => domain,
};
