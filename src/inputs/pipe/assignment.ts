import * as ast from './ast';
import { Context } from './context';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Scalar } from './scalar';
import { Sep } from './sep';
import { State } from './state';

export class Assignment extends NonTerminal {
  static peek(stream) {
    return stream.match(/\w+\s*=/, false);
  }

  apply(stream, ctx: Context) {
    // TODO don't allow user to set constants, functions, or steps
    // TODO mark builtins separately
    ctx.enqueue(Id.def());
    ctx.enqueue(Sep.assignment());
    ctx.enqueue(new Scalar());
  }

  protected _evaluate() {
    const [id, value] = this.values;
    return ast.assignment(id.id, value);
  }

  protected newCopy() {
    return new Assignment();
  }
}
