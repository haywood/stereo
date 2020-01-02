import * as math from 'mathjs';
import { Scope, Substitutions, PipeNode, StepNode, ScalarNode, ArithNode, Operand, FnNode } from './types';
import assert from 'assert';
import { pp } from '../pp';

export class Simplifier {
    constructor(
        private readonly scope: Scope,
        private readonly substitutions: Substitutions,
    ) { }

    simplify = (pipe: PipeNode): PipeNode => {
        const n = pipe.n;
        const chain = pipe.chain;

        return {
            kind: pipe.kind,
            n,
            chain: chain.map(this.simplifyStepNode),
        };
    };

    private simplifyStepNode = ({ kind, fn, args }: StepNode): StepNode => {
        return {
            kind,
            fn,
            args: args.map(this.simplifyOperand),
        };
    };

    private simplifyArithNode = (node: Operand): Operand => {
        if (node.kind === 'arith') {
            const [a, b] = node.operands.map(this.simplifyOperand);
            return {
                kind: node.kind,
                op: node.op,
                operands: [a, b],
            };
        } else if (node.kind === 'fn') {
            return this.simplifyFnNode(node);
        } else {
            return this.simplifyScalarNode(node);
        }
    };

    private simplifyOperand = (node: Operand): Operand => {
        switch (node.kind) {
            case 'scalar': return this.simplifyScalarNode(node);
            case 'arith': return this.simplifyArithNode(node);
            case 'fn': return this.simplifyFnNode(node);
        }
    };

    private simplifyScalarNode = (node: ScalarNode): Operand => {
        const { id, value } = node;
        if (value != null) {
            return node;
        } else if (id in this.substitutions) {
            return this.simplifyArithNode(this.substitutions[id]);
        } else if (id in Math && typeof Math[id] === 'function') {
            return { kind: node.kind, id, value: Math[id] };
        } else if (id) {
            const result = math.evaluate(id, this.scope);
            assert.equal(typeof result, 'number', `Expected evaluation of ${pp(id)} to produce a number`);
            return { kind: 'scalar', id, value: result };
        } else {
            return node;
        }
    };

    private simplifyFnNode = ({ kind, name, args }: FnNode): FnNode => {
        return {
            kind,
            name,
            args: args.map(this.simplifyOperand),
        };
    };
}
