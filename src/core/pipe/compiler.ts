import { NormalizedParams } from './types';
import { Parser } from './parser';
import {
  PipeNode,
  ArithNode,
  Scalar,
  StepNode,
  FnNode,
  IdNode,
  AccessNode,
} from './ast';

export class Compiler {
  private readonly simplifier: Simplifier;

  constructor(params: NormalizedParams) {
    this.simplifier = new Simplifier({
      theta: Parser.parseArith(params.theta),
    });
  }

  compilePipe = (expr: string): PipeNode => {
    const ast = Parser.parsePipe(expr);
    return this.simplifier.simplify(ast);
  };

  compileArith = (expr: string): ArithNode => {
    const ast = Parser.parseArith(expr);
    return this.simplifier.simplifyArithNode(ast);
  };
}

type Substitutions = {
  [id: string]: Scalar;
};

export class Simplifier {
  constructor(private readonly substitutions: Substitutions) {}

  simplify = (pipe: PipeNode): PipeNode => {
    const n = pipe.n;
    const chain = pipe.chain;

    return {
      kind: pipe.kind,
      n,
      chain: chain.map(this.simplifyStepNode),
    };
  };

  simplifyArithNode = ({ kind, op, operands }: ArithNode): ArithNode => {
    const [a, b] = operands.map(this.simplifyScalar);
    return { kind, op, operands: [a, b] };
  };

  private simplifyStepNode = ({ kind, type: fn, args }: StepNode): StepNode => {
    return {
      kind,
      type: fn,
      args: args.map(this.simplifyScalar),
    };
  };

  private simplifyScalar = (node: Scalar): Scalar => {
    switch (node.kind) {
      case 'number':
        return node;
      case 'fn':
        return this.simplifyFnNode(node);
      case 'access':
        return this.simplifyAccessNode(node);
      case 'id':
        return this.simplifyIdNode(node);
      case 'arith':
        return this.simplifyArithNode(node);
    }
  };

  private simplifyFnNode = ({ kind, name, args }: FnNode): FnNode => {
    return {
      kind,
      name,
      args: args.map(this.simplifyIdNode),
    };
  };

  private simplifyAccessNode = ({
    kind,
    id,
    index,
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
