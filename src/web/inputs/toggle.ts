import { Input } from './input';

export class ToggleInput extends Input<boolean> {
  constructor(
    readonly id: string,
    defaultText: string,
    { disabled = false, persistent = false } = {}
  ) {
    super(id, defaultText, {
      persistent,
      disabled,
      parse: text => {
        if (/1|true/i.test(text)) return true;
        else if (/0|false/i.test(text)) return false;
        else
          throw new Error(
            `invalid boolean value for input ${this.id}: ${text}`
          );
      },
      stringify: (bool: boolean) => {
        return bool ? '1' : '0';
      }
    });
  }

  protected _setup = () => {
    const on = this.el.querySelector<HTMLInputElement>('.on');
    if (!this.disabled) on.onclick = () => (this.value = true);

    const off = this.el.querySelector<HTMLInputElement>('.off');
    if (!this.disabled) off.onclick = () => (this.value = false);

    this.stream.subscribe(({ newValue }) => {
      if (newValue) {
        on.style.display = 'none';
        off.style.display = 'inline';
      } else {
        on.style.display = 'inline';
        off.style.display = 'none';
      }
    });
  };
}
