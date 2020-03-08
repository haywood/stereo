import { Context } from './context';
import { ID } from './patterns';
import { Terminal } from './terminal';

export class Sep extends Terminal {
  static assignment() {
    return new Sep('separator assignment', '=');
  }

  static comma() {
    return new Sep('separator comma', ',');
  }

  static dot() {
    return new Sep('separator dot', '.');
  }

  static lbrack() {
    return new Sep('separator lbrack', '[');
  }

  static rbrack() {
    return new Sep('separator rbrack', ']');
  }

  static lparen() {
    return new Sep('separator lparen', '(');
  }

  static rparen() {
    return new Sep('separator rparen', ')');
  }

  constructor(readonly style: string, private readonly value: string) {
    super();
  }

  match(stream) {
    stream.match(this.value);
  }

  evaluate(ctx: Context) {
    return '';
  }

  protected newCopy() {
    return new Sep(this.style, this.value);
  }
}
