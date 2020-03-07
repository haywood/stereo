import { Arg } from './arg';
import * as ast from './ast';
import { Context } from './context';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Sep } from './sep';

export class Step extends NonTerminal {
  static peek(stream) {
    return stream.match(/\w+\s*\(/, false);
  }

  apply(stream, ctx: Context) {
    ctx.enqueue(Id.stepType());
    ctx.enqueue(Sep.lparen());
    ctx.enqueue(new Arg());
  }

  protected _evaluate() {
    const [stepType, ...args] = this.values;
    return ast.step(stepType.id as ast.StepType, args);
  }

  protected newCopy() {
    return new Step();
  }
}
