import { Input } from './input';

export class ToggleInput extends Input<boolean> {
  constructor(
    readonly id: string,
    value: boolean,
    { disabled } = {disabled: false}
  ) {
    super(id, { disabled });

    this.value = value;
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
