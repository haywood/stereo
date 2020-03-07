import assert from 'assert';

import { Context } from './context';
import { Element } from './element';
import { Fn } from './fn';
import { Id } from './id';
import { NonTerminal } from './non_terminal';
import { Number } from './number';
import { Paren } from './paren';
import { Property } from './property';
import { State } from './state';
import { TermSep } from './term_sep';

export class Term extends NonTerminal {
  static peek(stream) {
    return Number.peek(stream) || Id.peek(stream);
  }

  apply(stream, ctx: Context) {
    if (Number.peek(stream)) {
      ctx.enqueue(new Number());
    } else if (Fn.peek(stream)) {
      ctx.enqueue(new Fn());
    } else if (Property.peek(stream)) {
      ctx.enqueue(new Property());
    } else if (Element.peek(stream)) {
      ctx.enqueue(new Element());
    } else if (Id.peek(stream)) {
      ctx.enqueue(Id.atom());
    } else if (Paren.peek(stream)) {
      ctx.enqueue(new Paren());
    }
  }

  protected _evaluate(ctx?: Context, stream?) {
    if (!stream.sol() && (TermSep.peek(stream) || Term.peek(stream))) {
      ctx?.enqueue(new TermSep());
    }
    return this.values[0];
  }

  protected newCopy() {
    return new Term();
  }
}
