import { PipeNode, StepNode, ScalarNode, Substitutions, Operand, FnNode, ArithNode } from "./ast";

export class Simplifier {
    constructor(
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

    private simplifyArithNode = ({ kind, op, operands }: ArithNode): ArithNode => {
        const [a, b] = operands.map(this.simplifyOperand);
        return {
            kind,
            op,
            operands: [a, b],
        };
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
