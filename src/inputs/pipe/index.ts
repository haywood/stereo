import 'codemirror/addon/mode/simple';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/lib/codemirror.css';

import CodeMirror from 'codemirror';
import { re } from 're-template-tag';
import { ReplaySubject } from 'rxjs';
import { escape } from 'xregexp';

import { Change } from '../change';
import { Input } from '../input';
import { Options } from '../options';
import {
  ArithOp,
  BuiltinConstant,
  BuiltinVariable,
  FnName,
  PipeNode,
  StepType,
  isValid
} from './ast';
import { Context } from './context';
import { Id } from './id';
import { Sep } from './sep';
import { Statement } from './statement';
import { Step } from './step';

export { Context } from './context';

export class PipeInput<T = PipeNode> extends Input<T, HTMLElement> {
  private text: string;
  private editor: CodeMirror;
  private ctx: Context;

  constructor(
    readonly id: string,
    defaultText: string,
    private readonly options: {
      startState: (then: (ast) => void) => Context;
    }
  ) {
    super(id, defaultText, {
      persistent: true,
      parse: () => ({} as T),
      stringify: () => this.text
    });

    this.text = defaultText;
  }

  protected newSubject() {
    return new ReplaySubject<Change<T>>();
  }

  protected _setup = () => {
    this.defineMode();

    this.editor = CodeMirror(this.el.querySelector('div[contenteditable]'), {
      lineNumbers: this.id == 'pipe',
      mode: this.id,
      readOnly: this.disabled ? 'nocursor' : false,
      value: this.initialText
    });

    this.text = this.editor.getValue();
    this.updateHash();
  };

  defineMode() {
    const startState = () =>
      this.options.startState(ctx => {
        const ast = ctx.root.evaluate();
        this.ctx = ctx;

        // TODO also check for semantic errors
        // e.g. wrong number of function args, redefining a constant, invalid
        // property access
        if (isValid(ast)) {
          if (this.editor) this.text = this.editor.getValue();

          this.value = ast;
        } else {
          console.error('found error(s) in ast', ast);
        }

        if (this.editor) {
          this.editor.showHint({
            hint: () => this.hint(),
            completeSingle: false
          });
        }
      });

    CodeMirror.defineMode(this.id, () => {
      return {
        startState,
        copyState: (ctx: Context) => ctx.clone(),
        token: (stream, ctx: Context) => ctx.apply(stream)
      };
    });
  }

  hint() {
    // TODO be smarter
    // - implement all of the suggestion contexts
    // - don't suggest 'p' in the pipe input. it's only valid in color
    //   expressions.
    const editor = this.editor;
    const cursor = editor.getCursor();
    const token = editor.getTokenAt(cursor);
    const start: number = token.start;
    const end: number = cursor.ch;
    const line: number = cursor.line;
    const currentWord: string = token.string;
    const from = CodeMirror.Pos(line, start);
    const to = CodeMirror.Pos(line, end);
    const list = [];
    const completions = {};
    const curr = line in this.ctx.states && this.ctx.states[line][start];

    console.debug('hint', cursor, token, this.ctx, curr);

    if (curr instanceof Statement) {
      addCompletions(availableCompletions.stepType);
    } else if (curr instanceof Step) {
      addCompletions(availableCompletions.stepType);
    } else if (curr instanceof Sep) {
      if (curr.token == '.') {
        addCompletions(availableCompletions.property);
      }
    } else if (curr instanceof Id) {
      const prev = this.ctx.states[line][start - 1];
      if (prev && prev instanceof Sep && prev.token == '.') {
        addCompletions(availableCompletions.property);
      } else {
        addCompletions(availableCompletions.builtinConstant);
        addCompletions(availableCompletions.builtinVariable);
      }
    }

    for (const prefix in completions) {
      if (prefix.startsWith(token.string)) {
        const text = completions[prefix];
        list.push({
          text,
          hint() {
            editor.replaceRange(text, from, to);
            editor.setCursor(line, from.ch + prefix.length);
          }
        });
      }
    }

    return { list, from, to };

    function addCompletions(c) {
      for (const prefix in c) {
        completions[prefix] = c[prefix];
      }
    }
  }
}

const availableCompletions = {
  arithOp: Object.values(ArithOp).reduce((memo, op) => {
    memo[op] = op;
    return memo;
  }, {}),

  builtinConstant: Object.values(BuiltinConstant).reduce((memo, name) => {
    memo[name] = name;
    return memo;
  }, {}),

  builtinVariable: Object.values(BuiltinVariable).reduce((memo, name) => {
    memo[name] = name;
    return memo;
  }, {}),

  fnName: Object.values(FnName).reduce((memo, name) => {
    const prefix = `${name}(`;
    memo[prefix] = `${prefix})`;
    return memo;
  }, {}),

  stepType: Object.values(StepType).reduce((memo, type) => {
    const prefix = `${type}(`;
    memo[prefix] = `${prefix})`;
    return memo;
  }, {}),

  property: ['hue', 'onset', 'pitch', 'power', 'tempo'].reduce((memo, name) => {
    const qualified = `.${name}`;
    memo[qualified] = qualified;
    memo[name] = name;
    return memo;
  }, {})
};
