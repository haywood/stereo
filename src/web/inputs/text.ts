import { Input } from './input';
import { Options } from './options';

export class TextInput<T = string> extends Input<
  T,
  HTMLInputElement | HTMLTextAreaElement
> {
  constructor(
    readonly id: string,
    defaultText: string,
    {
      parse,
      persistent = true,
      disabled = false,
      stringify = (t: T) => t.toString()
    }: Options<T> = {}
  ) {
    super(id, defaultText, { persistent, disabled, parse, stringify });
  }

  protected _setup = () => {
    this.el.disabled = this.disabled;

    this.el.onchange = () => {
      const value = this.parse(this.el.value);
      this.el.value = this.stringify(value);
      this.value = value;
    };

    this.el.oninput = () => this.setSize();

    this.stream.subscribe(({ newValue }) => {
      this.el.value = this.stringify(newValue);
      this.setSize();
    });
  };

  private setSize() {
    if (this.el instanceof HTMLInputElement)
      this.el.size = this.el.value.length;
    else {
      const lines = this.el.value.split('\n');
      this.el.rows = Math.min(10, lines.length);
      this.el.cols = Math.min(
        50,
        lines.reduce((max, line) => Math.max(max, line.length), 0)
      );
    }
  }
}
