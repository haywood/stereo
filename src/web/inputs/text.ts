import { Input } from './input';

export class TextInput extends Input<
  string,
  HTMLInputElement | HTMLTextAreaElement
> {
  constructor(
    readonly id: string,
    _value: string,
    { persistent = true, disabled = false, stringify = (s: string) => s } = {}
  ) {
    super(id, _value, { persistent, disabled, stringify });
  }

  protected _setup = () => {
    this.el.disabled = this.disabled;

    this.el.onchange = () => {
      this.el.value = this.stringify(this.el.value);
      this.value = this.el.value;
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

  protected parse(str: string) {
    return str;
  }
}
