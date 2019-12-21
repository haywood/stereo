import { getLogger } from 'loglevel';
import * as math from 'mathjs';
import { ASTNode } from './grammar.pegjs';
import { Scope, Substitutions, Value } from './types';
import assert from 'assert';
import { pp } from '../pp';

export class Simplifier {
    constructor(
        private readonly scope: Scope,
        private readonly substitutions: Substitutions,
    ) { }

    simplify = (pipe: ASTNode): ASTNode => {
        return this.simplifyPipeNode(pipe);
    };

    private simplifyPipeNode = (pipe: ASTNode): ASTNode => {
        const n = assertNumberInNode('n', pipe);
        const chain = assertDefInNode('chain', pipe);

        return {
            n,
            chain: chain.map(this.simplifyFunNode),
        };
    };

    private simplifyFunNode = (fun: ASTNode): ASTNode => {
        const fn = assertDefInNode('fn', fun);
        const args = assertDefInNode('args', fun);

        return {
            fn,
            args: args.map(this.simplifyFunArgNode),
        };
    };

    private simplifyFunArgNode = (arg: ASTNode): ASTNode => {
        if (arg.id) {
            return this.simplifyVarNode(arg);
        } else {
            return this.simplifyArithNode(arg);
        }
    };

    private simplifyArithNode = (arith: ASTNode): ASTNode => {
        if (arith.op != null) {
            const operands = assertDefInNode('operands', arith);
            return { op: arith.op, operands: operands.map(this.simplifyArithNode) };
        } else {
            return this.simplifyNumberNode(arith);
        }
    };

    private simplifyVarNode = (node: ASTNode): ASTNode => {
        const id = node.id;
        if (id in this.substitutions) {
            return this.simplifyArithNode(this.substitutions[id]);
        } else if (id in Math && typeof Math[id] === 'function') {
            return { id, value: Math[id] };
        } else {
            return { id, value: math.evaluate(id, this.scope) };
        }
    };

    private simplifyNumberNode = (scalar: ASTNode): ASTNode => {
        const { id, value } = scalar;
        if (value != null) {
            return scalar;
        } else if (id in this.substitutions) {
            return this.simplifyArithNode(this.substitutions[id]);
        } else if (id) {
            const result = math.evaluate(id, this.scope);
            assert.equal(typeof result, 'number', `Expected evaluation of ${pp(id)} to produce a number`);
            return { id, value: result };
        } else {
            return scalar;
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
