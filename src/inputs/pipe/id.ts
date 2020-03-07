import * as ast from './ast';
import { Context } from './context';
import { ID } from './patterns';
import { or } from './patterns';
import { Terminal } from './terminal';

const FN_NAME = or(ast.FnName);
const STEP_TYPE = or(ast.StepType);

export class Id extends Terminal {
  static atom() {
    return new Id('atom');
  }

  static fnName() {
    return new Id('atom builtin', FN_NAME);
  }

  static stepType() {
    return new Id('atom builtin', STEP_TYPE);
  }

  static def() {
    return new Id('variable def');
  }

  constructor(readonly style: string, readonly pattern: RegExp = ID) {
    super();
  }

  static peek(stream) {
    return stream.match(/\w/, false);
  }

  match(stream) {
    stream.match(this.pattern);
  }

  evaluate(ctx: Context) {
    return ast.id(this.token);
  }

  newCopy() {
    return new Id(this.style, this.pattern);
  }
}
