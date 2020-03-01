import { Input } from './input';
import { Options } from './options';
import { PipeNode } from '../pipe/ast';
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
      const value = this.parse(editor.getValue());
      // important to set text before value, since it's used for updating the
      // URL fragment
      this.text = this.el.value;
      this.value = value;
    });
  };
}

const pipeMode = CodeMirror.defineSimpleMode('pipe', {
  start: [
    { regex: /\b(audio|d0|n|q|sphere|stereo|t)\b/i, token: 'keyword' },
    { regex: /[a-z][a-z0-9]*/i, token: 'variable-3' }
  ]
});
