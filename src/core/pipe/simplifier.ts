import { PipeNode, StepNode, Operand, FnNode, ArithNode, IdNode } from "./ast";

type Substitutions = {
    [id: string]: Operand;
};

export class Simplifier {
    constructor(private readonly substitutions: Substitutions) { }

    simplify = (pipe: PipeNode): PipeNode => {
        const n = pipe.n;
        const chain = pipe.chain;

        return {
            kind: pipe.kind,
            n,
            chain: chain.map(this.simplifyStepNode),
        };
    };

    private simplifyStepNode = ({ kind, type: fn, args }: StepNode): StepNode => {
        return {
            kind,
            type: fn,
            args: args.map(this.simplifyOperand),
        };
    };

    private simplifyOperand = (node: Operand): Operand => {
        switch (node.kind) {
            case 'number': return node;
            case 'fn': return this.simplifyFnNode(node);
            case 'id': return this.simplifyIdNode(node);
            case 'arith': return this.simplifyArithNode(node);
        }
    };

    private simplifyFnNode = ({ kind, name, args }: FnNode): FnNode => {
        return {
            kind,
            name,
            args: args.map(this.simplifyOperand),
        };
    };

    private simplifyIdNode = (node: IdNode): Operand => {
        const { id } = node;
        if (id in this.substitutions) {
            return this.simplifyOperand(this.substitutions[id]);
        } else {
            return node;
        }
    };

    private simplifyArithNode = ({ kind, op, operands }: ArithNode): ArithNode => {
        const [a, b] = operands.map(this.simplifyOperand);
        return { kind, op, operands: [a, b] };
    };
}
