import * as ast from './ast';
import { Context } from './context';
import { Terminal } from './terminal';

export class Error extends Terminal {
  readonly style = 'error';

  evaluate(ctx?: Context, stream?: any) {
    return ast.error(this.token);
  }

  match(stream: any, ctx: Context) {
    console.debug('matching error', stream.string, stream.column(), ctx);
    stream.skipToEnd();
  }

  protected newCopy() {
    return new Error();
  }
}
