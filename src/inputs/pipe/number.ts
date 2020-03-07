import * as ast from './ast';
import { Context } from './context';
import { NUMBER } from './patterns';
import { Terminal } from './terminal';

export class Number extends Terminal {
  readonly style = 'number';

  static peek(stream) {
    return stream.match(/\d/, false);
  }

  match(stream) {
    stream.match(NUMBER);
  }

  evaluate(ctx: Context) {
    return ast.number(parseFloat(this.token));
  }

  newCopy() {
    return new Number();
  }
}
