import { Scope, CompiledAST, UnaryOperator, Link } from './types';
import { Value, ASTNode, PipeNode, StepNode, ScalarNode, ArithNode, Operand } from "./ast";
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
import * as math from 'mathjs';

export class Resolver {
    constructor(private readonly scope: Scope) { }

    resolve = (pipe: PipeNode): CompiledAST => {
        const chain = pipe.chain;
        const links: Link[] = [];
        const fun = chain.shift();
        const d = (fun.args.shift() as ScalarNode).value as number;
        const link = this.resolveFirstStep(d, fun);
        const n = Interval.n(link.fn.domain, pipe.n);

        links.push(link);

        for (let i = 0; i < chain.length; i++) {
            const fun = chain[i];
            const link = this.resolveStep(links[i].fn, fun);
            links.push(link);
        }

        const [init, iter] = this.buildComposites(links);
        return { n, init, iter };
    };

    private buildComposites = (links: Link[]) => {
        let builder = new CompositeFn.Builder();
        while (links.length && !links[0].isTemporal) {
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

    private resolveFirstStep = (d: number, fun: StepNode) => {
        const name = fun.fn;
        const args = fun.args;
        const fn = funs[name](d, ...args.map(this.resolveStepArg));
        const isTemporal = args.some(isNodeTemporal);

        return { fn, isTemporal };
    };

    private resolveStep = (prev: Fn, fun: StepNode): Link => {
        const name = fun.fn;
        const args = fun.args;
        const d = ranges[name](prev.d);
        const fn = funs[name](d, ...args.map(this.resolveStepArg));
        const isTemporal = args.some(isNodeTemporal);

        return { fn, isTemporal };
    };

    private resolveStepArg = (arg: Operand): Value => {
        switch (arg.kind) {
            case 'scalar': return arg.id ?
                this.resolveVarNode(arg)
                : this.resolveNumberNode(arg);
            case 'arith': return this.resolveArithOperand(arg);
        }
    };

    private resolveArithOperand = (node: Operand): number => {
        if (node.kind === 'arith') {
            const op = ops[node.op];
            const [a, b] = node.operands.map(this.resolveArithOperand);
            const c = op(a, b);
            return c;
        } else if (node.kind === 'fn') {
            const { name, args } = node;
            const fn = Math[name];
            assert(typeof fn === 'function', `Expected ${name} to be a Math function in ${pp(node)}`);
            return fn(...args.map(this.resolveArithOperand));
        } else {
            return this.resolveNumberNode(node);
        }
    };

    private resolveVarNode = (node: ScalarNode): Value => {
        const { id } = node;
        if (id in Math && typeof Math[id] === 'function') {
            return Math[id];
        } else if (id) {
            const result = math.evaluate(id, this.scope);
            assert.equal(typeof result, 'number', `Expected evaluation of ${pp(node)} to produce a number`);
            return result;
        } else {
            assert.fail(`don't know how to hand var node ${pp(node)}`);
        }
    };

    private resolveNumberNode = (node: ScalarNode): number => {
        const { id, value } = node;
        if (id) {
            const result = math.evaluate(id, this.scope);
            assert.equal(typeof result, 'number', `Expected evaluation of ${pp(node)} to produce a number`);
            return result;
        } else if (typeof value === 'number') {
            return value;
        } else {
            assert.fail(`don't know how to handle number node ${pp(node)}`);
        }
    };
}

const isNodeTemporal = (node: ASTNode): boolean => {
    switch (node.kind) {
        case 'scalar': return node.id === 't';
        case 'step': return node.args.some(isNodeTemporal);
        case 'arith': return node.operands.some(isNodeTemporal);
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
