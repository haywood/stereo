import { Defs, Scope } from './types';
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
import { Resolver } from './resolver';
import Interval from '../../fn/interval';

export class Compiler {
  private readonly simplifier: Simplifier;

  constructor(defs: Defs) {
    this.simplifier = new Simplifier({
      theta: Parser.parseScalar(defs.theta),
    });
  }

  compile(expr: string): PipeNode;
  compile(expr: string, startRule: 'scalar'): Scalar;
  compile(expr: string, startRule?: string): any {
    switch (startRule) {
      default:
        return this.compilePipe(expr);
      case 'scalar':
        return this.compileScalar(expr);
    }
  }

  private compilePipe = (expr: string): PipeNode => {
    const ast = this.simplifier.simplify(Parser.parsePipe(expr));
    // Due to the way that sampling is implemented, the actual
    // number of points generated will not be exactly the n specified
    // by the user, unless n happens to be the dth power of some number.
    // The below expression computes the exact number of points that will
    // be generated.
    ast.n = Interval.nPerLevel(ast.d0, ast.n) ** ast.d0;
    return ast;
  };

  private compileScalar = (expr: string): Scalar => {
    const ast = Parser.parseScalar(expr);
    return this.simplifier.simplifyScalar(ast);
  };
}

type Substitutions = {
  [id: string]: Scalar;
};

class Simplifier {
  constructor(private readonly substitutions: Substitutions) {}

  simplify = (pipe: PipeNode): PipeNode => {
    const { n, d0, steps } = pipe;

    return {
      kind: pipe.kind,
      n,
      d0,
      steps: steps.map(this.simplifyStepNode),
    };
  };

  simplifyScalar = (node: Scalar): Scalar => {
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

  private simplifyStepNode = ({ kind, type: fn, args }: StepNode): StepNode => {
    return {
      kind,
      type: fn,
      args: args.map(this.simplifyScalar),
    };
  };

  private simplifyArithNode = ({
    kind,
    op,
    operands,
  }: ArithNode): ArithNode => {
    const [a, b] = operands.map(this.simplifyScalar);
    return { kind, op, operands: [a, b] };
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
