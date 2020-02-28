import { Input } from './input';
import { Options } from './options';

export class TextInput<T = string> extends Input<
  T,
  HTMLInputElement | HTMLTextAreaElement
> {
  private text: string;

  constructor(
    readonly id: string,
    defaultText: string,
    { parse, persistent = true, disabled = false }: Options<T> = {}
  ) {
    super(id, defaultText, {
      persistent,
      disabled,
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
    this.setSize();

    this.el.onchange = () => {
      try {
        this.value = this.parse(this.el.value);
        this.text = this.el.value;
        this.el.setCustomValidity('');
      } catch (err) {
        // should already be handled by oninput
      }
    };

    this.el.oninput = () => {
      this.setSize();
      try {
        this.parse(this.el.value);
        this.el.setCustomValidity('');
      } catch (err) {
        this.markInvalid(err);
      }
    };
  };

  markInvalid(err: Error, delay = 500) {
    this.el.setCustomValidity(err.message);
    console.warn(err);
    setTimeout(() => this.el.reportValidity(), delay);
  }

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
