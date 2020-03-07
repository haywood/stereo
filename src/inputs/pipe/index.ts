import 'codemirror/addon/mode/simple';

import CodeMirror from 'codemirror';
import { re } from 're-template-tag';
import { ReplaySubject } from 'rxjs';
import { escape } from 'xregexp';

import { Change } from '../change';
import { Input } from '../input';
import { Options } from '../options';
import { PipeNode } from './ast';
import { Context } from './context';

export { Context } from './context';

export class PipeInput<T = PipeNode> extends Input<T, HTMLElement> {
  private text: string;
  private editor: CodeMirror;

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
    defineMode(this.id, () =>
      this.options.startState(ast => {
        if (this.editor) this.text = this.editor.getValue();
        this.value = ast;
      })
    );

    this.editor = CodeMirror(this.el.querySelector('div[contenteditable]'), {
      lineNumbers: this.id == 'pipe',
      mode: this.id,
      readOnly: this.disabled ? 'nocursor' : false,
      value: this.initialText
    });
  };
}

function defineMode(name: string, startState: () => Context) {
  CodeMirror.defineMode(name, () => {
    return {
      startState,

      copyState(ctx: Context) {
        return ctx.clone();
      },

      token(stream, ctx: Context) {
        return ctx.apply(stream);
      }
    };
  });
}
