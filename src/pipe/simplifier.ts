import { AccessNode, ArithNode, FnNode, IdNode, PipeNode, Scalar, StepNode } from './grammar.pegjs';
import { Defs } from './types';

export type Substitutions = {
  [id in keyof Defs]: Scalar;
};

export class Simplifier {
  constructor(private readonly substitutions: Substitutions) {}

  simplify = (pipe: PipeNode): PipeNode => {
    const { n, d0, steps } = pipe;
    return {
      kind: pipe.kind,
      n,
      d0,
      steps: steps.map(this.simplifyStepNode)
    };
  };

  simplifyScalar = (node: Scalar): Scalar => {
    switch (node.kind) {
      case 'number':
        return node;
      case 'arith':
        return this.simplifyArithNode(node);
      case 'fn':
        return this.simplifyFnNode(node);
      case 'access':
        return this.simplifyAccessNode(node);
      case 'id':
        return this.simplifyIdNode(node);
      case 'paren':
        return {kind: node.kind, scalar: this.simplifyScalar(node.scalar)};
    }
  };

  private simplifyStepNode = ({ kind, type: fn, args }: StepNode): StepNode => {
    return {
      kind,
      type: fn,
      args: args.map(this.simplifyScalar)
    };
  };
  private simplifyArithNode = ({
    kind,
    op,
    operands
  }: ArithNode): ArithNode => {
    const [a, b] = operands.map(this.simplifyScalar);
    return { kind, op, operands: [a, b] };
  };
  private simplifyFnNode = ({ kind, name, args }: FnNode): FnNode => {
    return {
      kind,
      name,
      args: args.map(this.simplifyIdNode)
    };
  };
  private simplifyAccessNode = ({
    kind,
    id,
    index
  }: AccessNode): AccessNode => {
    return { kind, id, index: this.simplifyScalar(index) };
  };
  private simplifyIdNode = (node: IdNode): Scalar => {
    const { id } = node;
    if (id in this.substitutions) {
      return this.simplifyScalar(this.substitutions[id]);
    } else {
      return node;
    }
  };
}
