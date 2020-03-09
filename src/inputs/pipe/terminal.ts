import assert from 'assert';

import { Context } from './context';
import { State } from './state';

export abstract class Terminal extends State {
  private _token: string;

  abstract get style(): string;

  abstract match(stream, ctx: Context);

  get token() {
    return this._token;
  }

  apply(stream, ctx: Context) {
    assert(!this.token, `token is already set to '${this.token}'`);
    this.match(stream, ctx);
    this._token = stream.current();
    console.debug(this.clone(), ctx.clone(), stream);

    if (this.token) {
      return this.style;
    }
  }

  protected abstract newCopy(): Terminal

  clone(): Terminal {
    const copy = this.newCopy();
    copy._token = this.token;
    return copy;
  };
}
