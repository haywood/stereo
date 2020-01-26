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
    return Parser.parsePipe(expr);
  };

  private compileScalar = (expr: string): Scalar => {
    return Parser.parseScalar(expr);
  };
}
