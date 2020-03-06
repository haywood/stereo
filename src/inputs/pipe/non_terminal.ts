import assert from 'assert';

import { Context } from './context';
import { Id } from './id';
import { State } from './state';

export abstract class NonTerminal extends State {
  evaluate(ctx?: Context, stream?): string {
    assert(!this.tokens.length, 'non-termals should never have tokens');
    const value = this._evaluate(ctx, stream);
    return value;
  }

  protected abstract _evaluate(ctx?: Context, stream?): any;
}
