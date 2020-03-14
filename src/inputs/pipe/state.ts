import { StringStream } from 'codemirror';
import { cloneDeep, isEmpty } from 'lodash';
import { re } from 're-template-tag';
import { escape } from 'xregexp';

import * as ast from './ast';
import { Context } from './context';
import { loc, peek, pos } from './util';

export abstract class State<T = any> {
  abstract resolve(): T | ast.ErrorNode;

  location: ast.Location;

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

  protected abstract _successors(stream: StringStream, src: string): State[];

  successors(stream: StringStream, src: string): State[] {
    if (!this.location) {
      this.location = loc(stream, src);
    }

    return this._successors(stream, src) ?? [];
  }

  resolveChild(child: State, stream: StringStream) {
    const value = child.resolve();
    if (value) this.values.push(value);
    this.location.end = child.location.end;
  }

  reset() {
    this.location = { start: 0, end: 0 };
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
    return ast.pipe(this.values.slice(), this.location);
  }
}

export class AssignmentState extends NonTerminal<ast.AssignmentNode> {
  _successors(stream: StringStream) {
    return [Terminal.def(), Terminal.eq(), new ScalarState()];
  }

  resolve() {
    const [name, value] = this.values;
    return ast.assignment(name, value, this.location);
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
    return ast.step(type, args.slice(), this.location);
  }
}

export class ScalarState extends NonTerminal<ast.Scalar> {
  readonly repeatable = true;

  _successors(stream: StringStream) {
    const needsTerm = this.needsTerm();
    if (this.needsTerm()) {
      return [new TermState()];
    } else if (peek(SCALAR_OP, stream)) {
      return [Terminal.scalarOp()];
    }
  }

  resolve() {
    return this.buildAst(this.values.slice());
  }

  private needsTerm() {
    if (isEmpty(this.values)) {
      return true;
    }

    const last = this.values[this.values.length - 1];
    return typeof last != 'object';
  }

  private buildAst(values: any[]): ast.Scalar {
    console.debug('buildAst', { scalar: this.clone(), values: values.slice() });
    while (values.includes('.')) {
      const pivot = values.indexOf('.');
      const receiver = values[pivot - 1];
      const member = values[pivot + 1];
      const property = ast.property(receiver, member, {
        start: receiver.location?.start,
        end: member.location?.end
      });
      values.splice(pivot - 1, 3, property);
    }

    const { EXP, EXP_CARET, MUL, DIV, ADD, SUB } = ast.ArithOp;
    const ops = [EXP, EXP_CARET, MUL, DIV, ADD, SUB];
    for (const op of ops) {
      if (values.includes(op)) {
        const pivot = values.indexOf(op);
        const a = this.buildAst(values.slice(0, pivot));
        const b = this.buildAst(values.slice(pivot + 1));
        console.debug({pivot, a, b, values: values.slice()});
        return ast.arith(
          op,
          [a, b],
          {
            start: Math.min(a.location?.start, b.location?.start),
            end: Math.max(a.location?.end, b.location?.end),
          }
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
    }

    return values[0];
  }
}

class TermState extends NonTerminal<ast.Scalar> {
  _successors(stream: StringStream, src: string) {
    if (peek('(', stream)) {
      return [new ParenState()];
    } else if (peek(/\d/, stream)) {
      return [Terminal.number()];
    } else if (peek(/\w+\s*\(/, stream)) {
      return [new FnState()];
    } else if (peek(/\w+\s*\[/, stream)) {
      return [new ElementState()];
    } else if (peek(/\w/, stream)) {
      return [Terminal.atom()];
    } else {
      return [new RejectState(stream, src)];
    }
  }

  resolve() {
    return this.values[0];
  }
}

class ParenState extends NonTerminal<ast.ParenNode> {
  _successors(stream: StringStream) {
    return [Terminal.lparen(), new ScalarState(), Terminal.rparen()];
  }

  resolve() {
    return ast.paren(this.values[0], this.location);
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
    if (name instanceof ast.ErrorNode) {
      return name;
    } else if (args instanceof ast.ErrorNode) {
      return ast.fn(name, [args], this.location);
    } else {
      return ast.fn(name, args.slice(), this.location);
    }
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
    return ast.element(id, index, this.location);
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
    return new Terminal('number', NUMBER, (text, location) =>
      ast.number(parseFloat(text), location)
    );
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
    private readonly factory: (s: string, location: ast.Location) => T
  ) {
    super();
  }

  apply(stream: StringStream, src: string): string {
    if (!this.location) {
      this.location = loc(stream, src);
    }

    if (stream.match(this.pattern)) {
      this.text = stream.current();
      this.location.end = pos(stream, src);

      return this._style;
    }
  }

  resolve() {
    return this.factory(this.text, this.location);
  }
}

export class RejectState extends Terminal<ast.ErrorNode> {
  private readonly context: string;

  constructor(stream: StringStream, src: string) {
    super('error', /[^\s]*/, ast.error);

    this.context = stream.string.slice(stream.pos);
    this.location = loc(stream, src);
  }

  toString() {
    return `${super.toString()} at '${this.context}'`;
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
const MANT = /\.\d*/;
const NUMBER = re`/(${INT}(${MANT})?|${MANT})([eE]${INT})?/i`;

function or(o: object): RegExp {
  return new RegExp(
    Object.values(o)
      .map(escape)
      .join('|'),
    'i'
  );
}
