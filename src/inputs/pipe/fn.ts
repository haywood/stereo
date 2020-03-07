import { Arg } from './arg';
import * as ast from './ast';
import { Context } from './context';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Sep } from './sep';

export class Fn extends NonTerminal {
  static peek(stream) {
    return stream.match(/\w+\s*\(/, false);
  }

  apply(stream, ctx: Context) {
    ctx.enqueue(Id.fnName());
    ctx.enqueue(Sep.lparen());
    ctx.enqueue(new Arg());
  }

  protected _evaluate() {
    const [name, ...args] = this.values;
    return ast.fn(name.id as ast.FnName, args);
  }

  protected newCopy() {
    return new Fn();
  }
}
