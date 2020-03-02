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
const pipeMode = CodeMirror.defineSimpleMode('pipe', {
  start: [
    { regex: or(Object.values(StepType)), token: 'builtin' },
    { regex: or(Object.values(FnName)), token: 'builtin' },
    { regex: or(Object.values(BuiltinConstant)), token: 'variable-3' },
    { regex: or(Object.values(BuiltinVariable)), token: 'variable-3' },
    {
      regex: or(Object.values(ArithOp).map(o => o.replace(/(.)/g, '\\$1'))),
      token: 'operator'
    },
    { regex: /[(),=\[\]]/, token: 'operator' },
    { regex: /\.[a-z][a-z0-9]*/i, token: 'variable-2' },
    { regex: /[a-z][a-z0-9]*/i, token: 'variable' },
    {
      regex: /[+-]?[1-9][0-9]*(\.[0-9]*)?([eE][+-]?[1-9][0-9]*)?/i,
      token: 'number'
    }
  ]
});

function or(values: string[]): RegExp {
  const disjunction = values.join('|');
  return new RegExp(r`\b(${disjunction})\b`, 'i');
}
