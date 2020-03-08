import 'codemirror/addon/mode/simple';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/lib/codemirror.css';

import CodeMirror from 'codemirror';
import { isEqual } from 'lodash';
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
  hasError
} from './ast';
import { Context } from './context';

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

    this.editor.on('change', () => {
      this.editor.showHint({ hint, completeSingle: false });
    });
  };

  defineMode() {
    this.ctx = this.options.startState(ast => {
      // TODO also check for semantic errors
      // e.g. wrong number of function args, redefining a constant, invalid
      // property access
      if (hasError(ast)) {
        console.error('found error(s) in ast', ast);
      } else if (isEqual(this.value, ast)) {
        console.debug('skipping ast update, because contents did not change');
      } else {
        if (this.editor) this.text = this.editor.getValue();

        this.value = ast;
      }
    });

    CodeMirror.defineMode(this.id, () => {
      return {
        startState: () => this.ctx,
        copyState: (ctx: Context) => this.ctx = ctx.clone(),
        token: (stream, ctx: Context) => this.ctx.apply(stream),
      };
    });
  }
}

function hint(editor) {
  // TODO be smarter
  //
  // - different suggestions in statement vs scalar context
  // - don't suggest 'p' in the pipe input. it's only valid in color
  //   expressions.
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

  Object.values(ArithOp).forEach(op => {
    completions[op] = op;
  });

  Object.values(BuiltinConstant).forEach(name => {
    completions[name] = name;
  });

  Object.values(BuiltinVariable).forEach(name => {
    completions[name] = name;
  });

  Object.values(FnName).forEach(name => {
    const prefix = `${name}(`;
    completions[prefix] = `${prefix})`;
  });

  Object.values(StepType).forEach(type => {
    const prefix = `${type}(`;
    completions[prefix] = `${prefix})`;
  });

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
}
