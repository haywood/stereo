import { StringStream } from 'codemirror';
import { cloneDeep, isEmpty } from 'lodash';
import { re } from 're-template-tag';
import { escape } from 'xregexp';
import { peek, pos } from './util';

import * as ast from './ast';
import { Context } from './context';

export abstract class State<T = any> {
  abstract resolve(): T;
  start: CodeMirror.Position;
  end: CodeMirror.Position;

  toString() {
    return `${this.constructor.name}`;
  }

  clone() {
    return cloneDeep(this);
  }
}

export abstract class NonTerminal<T = any> extends State<T> {
  protected readonly values = [];
  readonly repeatable: boolean = false;

  abstract _successors(stream: StringStream): State[];
  successors(stream: StringStream): State[] {
    const successors = this._successors(stream) ?? [];

    if (!this.start) this.start = pos(stream);

    for (const s of successors) {
      s.start = pos(stream);
    }

    return successors;
  }

  addValue(value: any, stream: StringStream) {
    if (value) this.values.push(value);
    this.end = pos(stream);
  }

  reset() {
    this.values.length = 0;
  }
}

export class PipeState extends NonTerminal<ast.PipeNode> {
  readonly repeatable = true;

  _successors(stream: StringStream) {
    if (peek(/\w+\s*=/, stream)) {
      return [new AssignmentState()];
    } else if (peek(/\w+\(/, stream)) {
      return [new StepState()];
    }
  }

  resolve() {
    return ast.pipe(this.values.slice());
  }
}

export class AssignmentState extends NonTerminal<ast.AssignmentNode> {
  _successors(stream: StringStream) {
    return [Terminal.def(), Terminal.eq(), new ScalarState()];
  }

  resolve() {
    const [name, value] = this.values;
    return ast.assignment(name, value);
  }
}

export class StepState extends NonTerminal<ast.StepNode> {
  _successors(stream: StringStream) {
    return [
      Terminal.stepType(),
      Terminal.lparen(),
      new ArgListState(),
      Terminal.rparen()
    ];
  }

  resolve() {
    const [type, args] = this.values;
    return ast.step(type, args.slice());
  }
}

export class ScalarState extends NonTerminal<ast.Scalar> {
  readonly repeatable = true;

  _successors(stream: StringStream) {
    const needsTerm = this.needsTerm();
    if (this.needsTerm()) {
      if (peek(/\w/, stream)) {
        return this.term(stream);
      } else {
        return [new RejectState(this)];
      }
    } else if (peek(SCALAR_OP, stream)) {
      return [Terminal.scalarOp()];
    }
  }

  resolve() {
    return this.buildAst(this.values.slice());
  }

  private term(stream: StringStream) {
    if (peek(/\d/, stream)) {
      return [Terminal.number()];
    } else if (peek(/\w+\s*\(/, stream)) {
      return [new FnState()];
    } else if (peek(/\w+\s*\[/, stream)) {
      return [new ElementState()];
    } else if (peek(/\w/, stream)) {
      return [Terminal.atom()];
    }
  }

  private needsTerm() {
    if (isEmpty(this.values)) {
      return true;
    }

    const last = this.values[this.values.length - 1];
    return typeof last != 'object';
  }

  private buildAst(values: any[]): any {
    while (values.includes('.')) {
      const pivot = values.indexOf('.');
      const receiver = values[pivot - 1];
      const member = values[pivot + 1];
      const property = ast.property(receiver, member);
      values.splice(pivot - 1, 3, property);
    }

    const { EXP, EXP_CARET, MUL, DIV, ADD, SUB } = ast.ArithOp;
    const ops = [EXP, EXP_CARET, MUL, DIV, ADD, SUB];
    for (const op of ops) {
      if (values.includes(op)) {
        const pivot = values.indexOf(op);
        return ast.arith(
          op,
          this.buildAst(values.slice(0, pivot)),
          this.buildAst(values.slice(pivot + 1))
        );
      }
    }

    if (values.length != 1) {
      console.warn(
        `wrong number of values; expected 1`,
        this.clone(),
        values.slice(),
        this.values.slice()
      );
    } else {
      return values[0];
    }
  }
}

class FnState extends NonTerminal<ast.FnNode> {
  _successors(stream: StringStream) {
    return [
      Terminal.fnName(),
      Terminal.lparen(),
      new ArgListState(),
      Terminal.rparen()
    ];
  }

  resolve() {
    const [name, args] = this.values;
    return ast.fn(name, args.slice());
  }
}

class ArgListState extends NonTerminal<ast.Scalar[]> {
  readonly repeatable = true;

  _successors(stream: StringStream) {
    if (this.needsArg()) {
      return [new ScalarState()];
    } else if (peek(',', stream)) {
      return [Terminal.comma()];
    }
  }

  resolve() {
    return this.values.filter(v => v != ',');
  }

  private needsArg() {
    if (isEmpty(this.values)) {
      return true;
    }

    const last = this.values[this.values.length - 1];
    return last == ',';
  }
}

export class ElementState extends NonTerminal<ast.ElementNode> {
  _successors(stream: StringStream) {
    return [
      Terminal.atom(),
      Terminal.lbrack(),
      new ScalarState(),
      Terminal.rbrack()
    ];
  }

  resolve() {
    const [id, index] = this.values;
    return ast.element(id, index);
  }
}

export class Terminal<T = any> extends State<T> {
  static atom() {
    return new Terminal('atom', ID, ast.id);
  }

  static comma() {
    return new Terminal('operator comma', ',', text => text);
  }

  static def() {
    return new Terminal('variable def', ID, ast.id);
  }

  static eq() {
    return new Terminal('operator assignment', '=', () => null);
  }

  static fnName() {
    return new Terminal('atom builtin', FN_NAME, text => text);
  }

  static lbrack() {
    return new Terminal('lbrack', '[', () => null);
  }

  static lparen() {
    return new Terminal('lparen', '(', () => null);
  }

  static number() {
    return new Terminal('number', NUMBER, text => ast.number(parseFloat(text)));
  }

  static rbrack() {
    return new Terminal('rbrack', ']', () => null);
  }

  static rparen() {
    return new Terminal('rparen', ')', () => null);
  }

  static scalarOp() {
    return new Terminal('operator', SCALAR_OP, text => text);
  }

  static stepType() {
    return new Terminal('atom builtin', STEP_TYPE, text => text);
  }

  protected text: string;

  constructor(
    private readonly _style: string,
    private readonly pattern,
    private readonly factory: (s: string) => T
  ) {
    super();
  }

  apply(stream: StringStream): string {
    this.start = pos(stream);

    if (stream.match(this.pattern)) {
      this.text = stream.current();
      return this._style;
    }
  }

  resolve() {
    return this.factory(this.text);
  }
}

export class RejectState extends Terminal<ast.ErrorNode> {
  constructor(readonly expected: State) {
    super('error', /[^\s]*/, ast.error);
  }

  toString() {
    return `${super.toString()}, expected '${this.expected}'`;
  }
}

const ID = /[a-z][a-z0-9]*/i;
const DEF = re`/(${ID})(\s*)(=)/i`;
const PROPERTY = re`/\.${ID}/i`;
const ARITH_OP = or(ast.ArithOp);
const SCALAR_OP = re`/\.|(${ARITH_OP})/`;
const FN_NAME = or(ast.FnName);
const STEP_TYPE = or(ast.StepType);
const INT = /[+-]?(0|[1-9])\d*/;
const MANT = /\.\d*/
const NUMBER = re`/(${INT}(${MANT})?|${MANT})([eE]${INT})?/i`;

function or(o: object): RegExp {
  return new RegExp(
    Object.values(o)
      .map(escape)
      .join('|'),
    'i'
  );
}
