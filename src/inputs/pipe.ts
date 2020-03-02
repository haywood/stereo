import { Input } from './input';
import { Options } from './options';
import {
  ArithOp,
  PipeNode,
  StepType,
  FnName,
  BuiltinConstant,
  BuiltinVariable
} from '../pipe/ast';
import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import { re } from 're-template-tag';
import { escape } from 'xregexp';

export class PipeInput extends Input<PipeNode, HTMLTextAreaElement> {
  private text: string;

  constructor(
    readonly id: string,
    defaultText: string,
    { parse }: Options<PipeNode> = {}
  ) {
    super(id, defaultText, {
      persistent: true,
      parse,
      stringify: () => this.text
    });

    this.text = defaultText;
  }

  valid() {
    return this.el.checkValidity();
  }

  protected _setup = () => {
    this.el.disabled = this.disabled;
    this.el.value = this.initialText;

    const editor = CodeMirror.fromTextArea(this.el, {
      lineNumbers: true,
      mode: 'pipe'
    });

    editor.on('change', () => {
      const text = editor.getValue();
      const value = this.parse(text);
      // important to set text before value, since it's used for updating the
      // URL fragment
      this.text = text;
      this.value = value;
    });
  };
}

const r = String.raw;

const ID = /[a-z][a-z0-9]*/i;
const PROPERTY = re`/\.${ID}/i`;
const INTEGER = /[+-]?[1-9]\d*/;
const NUMBER = re`/${INTEGER}(\.\d*)?([eE]${INTEGER})?/i`;

CodeMirror.defineSimpleMode('pipe', {
  start: [
    { regex: or(Object.values(StepType)), token: 'builtin' },
    { regex: or(Object.values(FnName)), token: 'builtin' },

    { regex: or(Object.values(BuiltinConstant)), token: 'builtin variable' },
    { regex: or(Object.values(BuiltinVariable)), token: 'builtin variable' },

    { regex: or(Object.values(ArithOp)), token: 'operator' },
    { regex: /[(),=\[\]]/, token: 'operator' },

    { regex: PROPERTY, token: 'property' },

    { regex: ID, token: 'variable' },

    { regex: NUMBER, token: 'number' }
  ]
});

function or(values: string[]): RegExp {
  const disjunction = values.map(escape).join('|');
  return new RegExp(r`\b(${disjunction})\b`, 'i');
}
