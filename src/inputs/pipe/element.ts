import assert from 'assert';

import * as ast from './ast';
import { Context } from './context';
import { Fn } from './fn';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Scalar } from './scalar';
import { Paren } from './paren';
import { Sep } from './sep';
import { State } from './state';

export class Element extends NonTerminal {
  static peek(stream) {
    return stream.match(/\w+\[/, false);
  }

  apply(stream, ctx: Context) {
    if (Element.peek(stream)) {
      ctx.enqueue(Id.atom());
      ctx.enqueue(Sep.lbrack());
      ctx.enqueue(new Element());
    } else {
      return new Scalar().apply(stream, ctx);
    }
  }

  _evaluate(ctx?: Context) {
    ctx?.enqueue(Sep.rbrack());
    const [root, ...indexes] = this.values;
    console.debug('Element._evaluate', this.values);
    return indexes.reduce(ast.element, root);
  }
}
