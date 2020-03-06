import { Arg } from './arg';
import { Context } from './context';
import { Terminal } from './terminal';

export class ArgSep extends Terminal {
  readonly style = 'separator';

  match(stream, ctx: Context) {
    if (stream.match(',')) {
      ctx.enqueue(new Arg());
    } else {
      stream.match(')');
    }
  }

  evaluate(ctx: Context) {
    return '';
  }
}
