import 'codemirror/addon/mode/simple';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/lib/codemirror.css';

import CodeMirror, {Editor} from 'codemirror';
import { re } from 're-template-tag';
import {isEmpty} from 'lodash';
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
  findErrors
} from './ast';
import { Context } from './context';

export { Context } from './context';

export class PipeInput<T = PipeNode> extends Input<T, HTMLElement> {
  private text: string;
  private editor: CodeMirror.Editor;
  private ctx: Context<T>;

  constructor(
    readonly id: string,
    defaultText: string,
    private readonly options: {
      startState: (then: (ctx) => void) => Context<T>;
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
        const ast = ctx.resolve();

        // TODO also check for semantic errors
        // e.g. wrong number of function args, redefining a constant, invalid
        // property access
        const errors = findErrors(ast);
        if (isEmpty(errors)) {
          if (this.editor) this.text = this.editor.getValue();

          this.value = ast;
        } else {
          console.error('found error(s) in ast', errors, ast);
        }
      });

    CodeMirror.defineMode(this.id, () => {
      return {
        startState,
        copyState: (ctx: Context<T>) => ctx.clone(),
        token: (stream, ctx: Context<T>) => ctx.token(stream)
      };
    });
  }
}
