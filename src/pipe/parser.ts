import grammar from './grammar.pegjs';
import * as ast from './ast';

const tracer = {
  trace: e => {
    // Add logging below to debug the grammar
    // Should filter events or each parse will be extremely slow
    // e.g.
    // if (e.rule == 'assignment') {
    //   console.debug(e);
    // }
  }
};

export class Parser {
  static parsePipe(pipe: string): ast.PipeNode {
    return grammar.parse(pipe, {
      tracer,
      variables: {
        n: ast.number(Math.round(window.screen.width * window.screen.height)),
        d0: ast.number(4)
      },
      ast
    });
  }

  static parseScalar(expr: string): ast.Scalar {
    return grammar.parse(expr, { startRule: 'scalar', tracer, ast });
  }
}
