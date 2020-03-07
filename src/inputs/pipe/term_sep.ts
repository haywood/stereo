import * as ast from './ast';
import { Context } from './context';
import { Id } from './id';
import { or } from './patterns';
import { Term } from './term';
import { Terminal } from './terminal';

const ARITH_OP = or(ast.ArithOp);

export class TermSep extends Terminal {
  readonly style = 'separator';

  static peek(stream) {
    return stream.match(ARITH_OP, false);
  }

  match(stream, ctx: Context) {
    if (stream.match(ARITH_OP)) {
      ctx.enqueue(new Term());
    }
  }

  evaluate(ctx: Context) {
    return this.token;
  }

  protected newCopy() {
    return new TermSep();
  }
}
