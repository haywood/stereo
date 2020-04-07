import 'codemirror/addon/mode/simple';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/lib/codemirror.css';

import cm from 'codemirror';
import { isEmpty, isEqual } from 'lodash';

import { Input } from '../input';
import { persistenceManager } from '../persistence_manager';
import { PipeNode } from './ast';
import { Context } from './context';
import { hint } from './hint';
import { findErrors, lint } from './lint';
import { inputs } from '..';

export { Context } from './context';

export class PipeInput<T = PipeNode> extends Input<T, HTMLElement> {
  private text: string;
  private editor: cm.Editor;
  private tabIndex?: number;

  constructor(
    readonly id: string,
    private readonly defaultText: string,
    private readonly options: {
      startState: () => Context<T>;
      tabIndex?: number;
    }
  ) {
    super(id);

    this.text = persistenceManager.get(this.id, defaultText);
    this.tabIndex = options.tabIndex;

    const textFn = () => this.text == this.defaultText ? '' : this.text;
    persistenceManager.manage(this.id, this.stream, textFn, text => {
      const newText = text ? text : defaultText;
      if (newText == this.text) return;

      this.editor.setValue(newText);
    });
  }

  protected _setup = () => {
    const div = this.el.querySelector<HTMLElement>('div[contenteditable]');
    this.defineMode();

    this.editor = cm(div, {
      lineNumbers: this.id == 'pipe',
      mode: this.id,
      readOnly: this.disabled ? 'nocursor' : false,
      value: this.text,
      tabindex: this.tabIndex,
      gutters: ['CodeMirror-lint-markers'],
      lint: true
    });

    cm.registerHelper('lint', this.id, () => this.lint());

    this.editor.on('change', () => this.maybeUpdateValue());

    this.editor.on('cursorActivity', () => this.hint());

    this.maybeUpdateValue();
    this.lint();
  };

  private maybeUpdateValue() {
    const ast = this.resolve();

    if (isEqual(ast, this.value)) return;

    const errors = findErrors(ast);
    if (isEmpty(errors)) {
      this.text = this.editor.getValue();

      this.value = ast;
    } else {
      console.error('found error(s) in ast', errors, ast);
    }
  }

  private lint() {
    return lint(this.resolve());
  }

  private hint() {
    const ast = this.resolve();

    this.editor.showHint({
      hint: (editor: cm.Editor) =>
        hint(editor, ast, ast.variables ?? inputs.pipe.value?.variables ?? {}),
      completeSingle: false
    });
  }

  private resolve() {
    // typings are wrong and don't document the second arg to getStateAfter
    return (this.editor as any).getStateAfter(null, true).resolve();
  }

  private defineMode() {
    cm.defineMode(this.id, () => {
      return {
        startState: this.options.startState,
        copyState: (ctx: Context<T>) => ctx.clone(),
        token: (stream, ctx: Context<T>) => ctx.token(stream)
      };
    });
  }
}
