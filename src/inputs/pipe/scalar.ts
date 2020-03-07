import assert from 'assert';

import endent from 'endent';

import * as ast from './ast';
import { Context } from './context';
import { NonTerminal } from './non_terminal';
import { Term } from './term';

const { EXP, EXP_CARET, MUL, DIV, ADD, SUB } = ast.ArithOp;

export class Scalar extends NonTerminal {
  static peek(stream) {
    return Term.peek(stream);
  }

  apply(stream, ctx: Context) {
    ctx.enqueue(new Term());
  }

  protected _evaluate() {
    return evaluate(this.values);
  }

  protected newCopy() {
    return new Scalar();
  }
}

function evaluate(values: any[]) {
  while (values.includes('.')) {
    const pivot = values.indexOf('.');
    const [receiver, _, member] = values.slice(pivot - 1, pivot + 2);
    values.splice(pivot - 1, 3, ast.property(receiver, member));
  }

  for (const op of arithOps) {
    const pivot = values.indexOf(op);
    if (pivot < 0) continue;

    return ast.arith(
      op,
      evaluate(values.slice(0, pivot)),
      evaluate(values.slice(pivot + 1))
    );
  }

  return values[0];
}

const arithOps: ast.ArithOp[] = [EXP, EXP_CARET, MUL, DIV, ADD, SUB];
