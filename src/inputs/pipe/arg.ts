import { ArgSep } from './arg_sep';
import { Context } from './context';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Scalar } from './scalar';
import { State } from './state';

export class Arg extends NonTerminal {
  static peek(stream) {
    return Scalar.peek(stream);
  }

  apply(stream, ctx: Context) {
    ctx.enqueue(new Scalar());
  }

  _evaluate(ctx?: Context) {
    ctx?.enqueue(new ArgSep());
    return this.values[0];
  }
}
