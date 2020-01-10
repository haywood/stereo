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
import Interval from '../fn/interval';

export class Compiler {
  private readonly simplifier: Simplifier;

  constructor(defs: Defs, private readonly scope: Scope) {
    this.simplifier = new Simplifier({
      theta: Parser.parseScalar(defs.theta),
    });
  }

  compilePipe = (expr: string): PipeNode => {
    const ast = this.simplifier.simplify(Parser.parsePipe(expr));
    const resolver = new Resolver(this.scope);
    const d = resolver.resolve(ast.chain[0].args[0], 'number');
    // Due to the way that sampling is implemented, the actual
    // number of points generated will not be exactly the n specified
    // by the user, unless n happens to be the dth power of some number.
    // The below expression computes the exact number of points that will
    // be generated.
    ast.n = Interval.nPerLevel(d, ast.n) ** d;
    return ast;
  };

  compileScalar = (expr: string): Scalar => {
    const ast = Parser.parseScalar(expr);
    return this.simplifier.simplifyScalar(ast);
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
