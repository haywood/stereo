import {
  AccessNode,
  ArithNode,
  FnNode,
  IdNode,
  PipeNode,
  Scalar,
  StepNode
} from './grammar.pegjs';

export type Substitutions = {
  theta: Scalar;
};

export class Simplifier {
  constructor(private readonly substitutions: Substitutions) {}

  simplify(pipe: PipeNode): PipeNode;
  simplify(node: Scalar): Scalar;

  simplify(node: any): any {
    switch (node.kind) {
      case 'pipe':
        return {
          ...node,
          steps: node.steps.map(s => this.simplifyStepNode(s))
        };
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
        return { kind: node.kind, scalar: this.simplify(node.scalar) };
    }
  }

  private simplifyStepNode({ kind, type: fn, args }: StepNode): StepNode {
    return {
      kind,
      type: fn,
      args: args.map(a => this.simplify(a))
    };
  }

  private simplifyArithNode({ kind, op, operands }: ArithNode): ArithNode {
    const [a, b] = operands.map(o => this.simplify(o));
    return { kind, op, operands: [a, b] };
  }

  private simplifyFnNode({ kind, name, args }: FnNode): FnNode {
    return {
      kind,
      name,
      args: args.map(a => this.simplifyIdNode(a))
    };
  }

  private simplifyAccessNode({ kind, id, index }: AccessNode): AccessNode {
    return { kind, id, index: this.simplify(index) };
  }

  private simplifyIdNode(node: IdNode): Scalar {
    const { id } = node;
    if (id in this.substitutions) {
      return this.simplify(this.substitutions[id]);
    } else {
      return node;
    }
  }
}
