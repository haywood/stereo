import * as ast from './ast';
import { Context } from './context';
import { Fn } from './fn';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Number } from './number';
import { Paren } from './paren';
import { Sep } from './sep';
import { State } from './state';

export class Property extends NonTerminal {
  static peek(stream) {
    return stream.match(/\w+\./, false);
  }

  apply(stream, ctx: Context) {
    if ((stream.match(/\w+\.{2}/), false)) {
      ctx.enqueue(Id.atom());
      ctx.enqueue(Sep.dot());
      ctx.enqueue(new Property());
    } else {
      ctx.enqueue(Id.atom());
      ctx.enqueue(Sep.dot());
      ctx.enqueue(Id.atom());
    }
  }

  _evaluate(ctx?: Context) {
    const [root, ...ids] = this.values;
    return ids.reduce(ast.property, root);
  }
}
