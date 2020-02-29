import grammar from './grammar.pegjs';
import * as ast from './ast';

export class Parser {
  static parsePipe(pipe: string): ast.PipeNode {
    return grammar.parse(pipe, {
      variables: {
        n: ast.number(Math.round(window.screen.width * window.screen.height)),
        d0: ast.number(4)
      },
      ast
    });
  }

  static parseScalar(expr: string): ast.Scalar {
    return grammar.parse(expr, { startRule: 'scalar', ast });
  }
}
