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

export class PipeInput<T = PipeNode> extends Input<T, HTMLTextAreaElement> {
  private text: string;

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

  private get textArea() {
    return this.el.querySelector('textarea');
  }

  valid() {
    return this.textArea.checkValidity();
  }

  protected newSubject() {
    return new ReplaySubject<Change<T>>();
  }

  protected _setup = () => {
    this.textArea.disabled = this.disabled;
    this.textArea.value = this.initialText;

    defineMode(this.id, () =>
      this.options.startState(ast => {
        this.value = ast;
      })
    );

    const editor = CodeMirror.fromTextArea(this.textArea, {
      lineNumbers: this.id == 'pipe',
      mode: this.id
    });

    editor.on('change', () => {
      this.text = editor.getValue();
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
