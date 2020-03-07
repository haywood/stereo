import endent from 'endent';

import { Assignment } from './assignment';
import { Context } from './context';
import { NonTerminal } from './non_terminal';
import { Step } from './step';

export class Statement extends NonTerminal {
  static peek(stream) {
    return true;
  }

  apply(stream, ctx: Context) {
    if (Assignment.peek(stream)) {
      ctx.enqueue(new Assignment());
    } else if (Step.peek(stream)) {
      ctx.enqueue(new Step());
    }
  }

  protected _evaluate() {
    return this.values[0];
  }

  protected newCopy() {
    return new Statement();
  }
}
