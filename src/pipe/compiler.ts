import Interval from '../fn/interval';
import { PipeNode, Scalar } from './grammar.pegjs';
import { Parser } from './parser';

export class Compiler {
  constructor() {}

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
    const ast = Parser.parsePipe(expr);
    // Due to the way that sampling is implemented, the actual
    // number of points generated will not be exactly the n specified
    // by the user, unless n happens to be the dth power of some number.
    // The below expression computes the exact number of points that will
    // be generated.
    ast.n = Interval.nPerLevel(ast.d0, ast.n) ** ast.d0;
    return ast;
  };

  private compileScalar = (expr: string): Scalar => {
    return Parser.parseScalar(expr);
  };
}
