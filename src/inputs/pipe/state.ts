import { StringStream } from 'codemirror';
import { cloneDeep, isEmpty } from 'lodash';
import { re } from 're-template-tag';
import { escape } from 'xregexp';

import * as ast from './ast';
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

  protected abstract _successors(stream: StringStream): State[];

  successors(stream: StringStream): State[] {
    if (!this.location) {
      this.location = loc(stream);
    }

    return this._successors(stream) ?? [];
  }

  resolveChild(child: State, stream: StringStream) {
    const value = child.resolve();
    if (value) {
      this.values.push(value);
      this.onResolveChild(value);
    }
    this.location.end = child.location.end;
  }

  protected onResolveChild(value: any) {}
}

export class PipeState extends NonTerminal<ast.PipeNode> {
  private readonly assignments: ast.AssignmentNode[] = [];
  private readonly steps: ast.StepNode[] = [];
  private readonly errors: ast.ErrorNode[] = [];
  readonly repeatable = true;

  private get assignmentSet() {
    return new Set(this.assignments.map(a => a.name.id));
  }

  _successors(stream: StringStream) {
    if (peek(/\w+\s*=/, stream)) {
      if (isEmpty(this.steps)) {
        return [new AssignmentState(this.assignmentSet)];
      } else {
        return [
          new RejectState(
            stream,
            'Assignments cannot take place after steps have begun.',
            /.+/,
          )
        ];
      }
    } else if (peek(/\w+\(/, stream)) {
      return [new StepState(this.assignmentSet)];
    }
  }

  protected onResolveChild(value: any) {
    if (value instanceof ast.AssignmentNode) {
      this.assignments.push(value);
    } else if (value instanceof ast.StepNode) {
      this.steps.push(value);
    } else {
      this.errors.push(value);
    }
  }

  resolve() {
    return ast.pipe(this.assignments, this.steps, this.errors, this.location);
  }
}

export class AssignmentState extends NonTerminal<ast.AssignmentNode> {
  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    return [
      new LhsState(new Set(this.assignedNames)),
      Terminal.eq(),
      new ScalarState(this.assignedNames)
    ];
  }

  protected onResolveChild(value: any) {
    if (value instanceof ast.IdNode) {
      this.assignedNames.add(value.id);
    }
  }

  resolve() {
    const [name, value] = this.values;
    return ast.assignment(name, value, this.location);
  }
}

export class StepState extends NonTerminal<ast.StepNode> {
  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    return [
      Terminal.stepType(),
      Terminal.lparen(),
      new ArgListState(this.assignedNames),
      Terminal.rparen()
    ];
  }

  resolve() {
    const [type, args] = this.values;
    if (args instanceof ast.ErrorNode) {
      return ast.step(type, [args], this.location);
    } else {
      return ast.step(type, args?.slice() ?? [], this.location);
    }
  }
}

export class ScalarState extends NonTerminal<ast.Scalar> {
  readonly repeatable = true;

  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    const needsTerm = this.needsTerm();
    if (this.needsTerm()) {
      return [new TermState(this.assignedNames)];
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
    const { EXP, EXP_CARET, MUL, DIV, ADD, SUB } = ast.ArithOp;
    const ops = [EXP, EXP_CARET, MUL, DIV, ADD, SUB];
    for (const op of ops) {
      if (values.includes(op)) {
        const pivot = values.indexOf(op);
        const a = this.buildAst(values.slice(0, pivot));
        const b = this.buildAst(values.slice(pivot + 1));
        return ast.arith(op, [a, b], {
          start: a.location.start,
          end: b.location.end,
        });
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
  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    if (peek('(', stream)) {
      return [new ParenState(this.assignedNames)];
    } else if (peek(/\d/, stream)) {
      return [Terminal.number()];
    } else if (peek(/\w+\s*\(/, stream)) {
      return [new FnState(this.assignedNames)];
    } else if (peek(/\w/, stream)) {
      return [Terminal.atom(this.assignedNames)];
    } else {
      return [new RejectState(stream)];
    }
  }

  resolve() {
    return this.values[0];
  }
}

class ParenState extends NonTerminal<ast.ParenNode> {
  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    return [
      Terminal.lparen(),
      new ScalarState(this.assignedNames),
      Terminal.rparen()
    ];
  }

  resolve() {
    return ast.paren(this.values[0], this.location);
  }
}

class FnState extends NonTerminal<ast.FnNode> {
  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    return [
      Terminal.fnName(),
      Terminal.lparen(),
      new ArgListState(this.assignedNames),
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

  constructor(private readonly assignedNames: Set<string>) {
    super();
  }

  _successors(stream: StringStream) {
    const canHasArg = this.canHasArg();
    if (peek(')', stream) && canHasArg) {
      return [];
    } else if (canHasArg) {
      return [new ScalarState(this.assignedNames)];
    } else if (peek(',', stream)) {
      return [Terminal.comma()];
    }
  }

  resolve() {
    return this.values.filter(v => v != ',');
  }

  private canHasArg() {
    if (isEmpty(this.values)) {
      return true;
    }

    const last = this.values[this.values.length - 1];
    return last == ',';
  }
}

export class Terminal<T = any> extends State<T> {
  static atom(assignedNames: Set<string>) {
    return new Terminal('atom', ID, ast.id, text => {
      const isValid = assignedNames.has(text) || ast.alwaysDefinedIds.has(text);
      const reason = isValid ? '' : `name '${text}' is undefined`;
      return {isValid, reason};
    });
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
    private readonly factory: (s: string, location: ast.Location) => T,
    private readonly valid = (s: string) => ({ isValid: true, reason: ''})
  ) {
    super();
  }

  apply(stream: StringStream): string {
    if (!this.location) {
      this.location = loc(stream);
    }

    if (stream.match(this.pattern)) {
      this.text = stream.current();
      this.location.end = pos(stream);

      if (this.valid(this.text).isValid) {
        return this._style;
      } else {
        return 'error';
      }
    }
  }

  resolve() {
    const {isValid, reason} = this.valid(this.text);
    if (isValid) {
      return this.factory(this.text, this.location);
    } else {
      return ast.error(reason, this.location);
    }
  }
}

class LhsState extends Terminal<ast.IdNode | ast.ErrorNode> {
  private isReassignment = false;
  constructor(private readonly assignedNames: Set<string>) {
    super('variable def', ID, ast.id);
  }

  apply(stream: StringStream) {
    const style = super.apply(stream);
    if (this.assignedNames.has(this.text)) {
      this.isReassignment = true;
      return 'error';
    } else {
      return style;
    }
  }

  resolve() {
    if (this.isReassignment) {
      return ast.error(`name '${this.text}' is already defined`, this.location);
    } else {
      return super.resolve();
    }
  }
}

export class RejectState extends Terminal<ast.ErrorNode> {
  private readonly context: string;

  constructor(
    stream: StringStream,
    private readonly reason?: string,
    pattern?: RegExp,
  ) {
    super('error', pattern ?? /[^\s]*/, (s, l) =>
      ast.error(this.reason ?? `unexpected token: '${s}'`, l)
    );

    this.context = stream.string.slice(stream.pos);
    this.location = loc(stream);
  }

  toString() {
    return `${super.toString()} at '${this.context}', because ${this.reason}`;
  }
}

// IDs must start with a letter
// and cannot end with an underscore
const ID = /[a-z]\w*[a-z0-9]*/i;
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
      .sort((a, b) => b.length - a.length)
      .map(escape)
      .join('|'),
    'i'
  );
}
