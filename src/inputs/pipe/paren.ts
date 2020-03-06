import * as ast from './ast';
import { Context } from './context';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Scalar } from './scalar';
import { Sep } from './sep';

export class Paren extends NonTerminal {
  static peek(stream) {
    return stream.match(/\(/, false);
  }

  apply(stream, ctx: Context) {
    ctx.enqueue(Sep.lparen());
    ctx.enqueue(new Scalar());
  }

  protected _evaluate(ctx?: Context) {
    ctx?.enqueue(Sep.rparen());
    const [scalar] = this.values;
    return ast.paren(scalar);
  }
}
