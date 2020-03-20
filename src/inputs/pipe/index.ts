import 'codemirror/addon/mode/simple';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/lib/codemirror.css';

import cm, { Editor } from 'codemirror';
import { isEmpty, isEqual } from 'lodash';
import { re } from 're-template-tag';
import { ReplaySubject } from 'rxjs';
import { escape } from 'xregexp';

import { inputs } from '..';
import { Change } from '../change';
import { Input } from '../input';
import { Options } from '../options';
import { eoi } from './util';
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
import { hint } from './hint';

export { Context } from './context';

export class PipeInput<T = PipeNode> extends Input<T, HTMLElement> {
  private text: string;
  private editor: cm.Editor;
  private tabIndex?: number;

  constructor(
    readonly id: string,
    defaultText: string,
    private readonly options: {
      startState: (src: () => string) => Context<T>;
      tabIndex?: number;
    }
  ) {
    super(id, defaultText, {
      persistent: true,
      parse: () => null,
      stringify: () => this.text
    });

    this.text = defaultText;
    this.tabIndex = options.tabIndex;
  }

  protected newSubject() {
    return new ReplaySubject<Change<T>>();
  }

  protected _setup = () => {
    const div = this.el.querySelector<HTMLElement>('div[contenteditable]');
    this.text = this.initialText;
    this.defineMode();

    this.editor = cm(div, {
      lineNumbers: this.id == 'pipe',
      mode: this.id,
      readOnly: this.disabled ? 'nocursor' : false,
      value: this.initialText,
      tabindex: this.tabIndex
    });

    this.editor.on('change', () => this.maybeUpdateValue());

    this.editor.on('cursorActivity', () => this.hint());

    this.maybeUpdateValue();
  };

  private maybeUpdateValue() {
    const ast = this.ctx().resolve();

    if (isEqual(ast, this.value)) return;

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
  }

  private hint() {
    const ast = this.ctx().resolve();

    this.editor?.showHint({
      hint: (editor: cm.Editor) => hint(editor, ast, ast.variables ?? inputs.pipe.value.variables),
        completeSingle: false
    });
  }

  private ctx() {
    // typings are wrong and don't document the second arg to getStateAfter
    return (this.editor as any).getStateAfter(null, true);
  }

  private defineMode() {
    const startState = () => this.options.startState(() => this.editor?.getValue() ?? this.text);

    cm.defineMode(this.id, () => {
      return {
        startState,
        copyState: (ctx: Context<T>) => ctx.clone(),
        token: (stream, ctx: Context<T>) => ctx.token(stream)
      };
    });
  }
}
