import assert from 'assert';

import { Context } from './context';
import { State } from './state';

export abstract class Terminal extends State {
  protected token: string;

  abstract get style(): string;

  abstract match(stream, ctx: Context);

  apply(stream, ctx: Context) {
    assert(!this.token, `token is already set to '${this.token}'`);
    this.match(stream, ctx);
    this.token = stream.current();

    if (this.token) {
      return this.style;
    }
  }

  protected abstract newCopy(): Terminal

  clone(): Terminal {
    const copy = this.newCopy();
    copy.token = this.token;
    return copy;
  };
}
