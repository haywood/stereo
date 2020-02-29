import grammar from './grammar.pegjs';
import * as ast from './ast';

export class Parser {
  static parsePipe(pipe: string): ast.PipeNode {
    return grammar.parse(pipe, { ast });
  }

  static parseScalar(expr: string): ast.Scalar {
    return grammar.parse(expr, { startRule: 'scalar', ast });
  }
}
