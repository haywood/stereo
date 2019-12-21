import { getLogger } from 'loglevel';
import * as math from 'mathjs';
import { ASTNode } from './grammar.pegjs';
import { Scope, SimplifiedAST, Substitutions, SimplifiedFunctionCall, Value } from './types';
import assert from 'assert';
import { pp } from '../pp';

export class Resolver {
    constructor(private readonly scope: Scope) { }

    resolve = (pipe: ASTNode): SimplifiedAST => {
        return this.resolvePipeNode(pipe);
    };

    private resolvePipeNode = (pipe: ASTNode): SimplifiedAST => {
        const n = assertNumberInNode('n', pipe);
        const chain = assertDefInNode('chain', pipe);

        return {
            n,
            chain: chain.map(this.resolveFunNode),
        };
    };

    private resolveFunNode = (fun: ASTNode): SimplifiedFunctionCall => {
        const fn = assertDefInNode('fn', fun);
        const args = assertDefInNode('args', fun);

        return {
            fn,
            args: args.map(this.resolveFunArgNode),
            isTemporal: args.some(isTemporal),
        };
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
            const [a, b] = assertDefInNode('operands', node);
            return op(this.resolveArithNode(a), this.resolveArithNode(b));
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

const isTemporal = (node: ASTNode): boolean => {
    if (node.id === 't') return true;
    else if (node.args) return node.args.some(isTemporal);
    else if (node.operands) return node.operands.some(isTemporal);
    else if (node.sub) return isTemporal(node.sub);
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
