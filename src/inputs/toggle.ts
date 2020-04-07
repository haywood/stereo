import { Input } from './input';
import { persistenceManager } from './persistence_manager';

export class ToggleInput extends Input<boolean> {
  constructor(
    readonly id: string,
    defaultValue: boolean,
    { disabled, persistent = false } = {disabled: false}
  ) {
    super(id, { disabled });

    if (disabled) return;

    if (persistent) {
      const text = persistenceManager.get(this.id, defaultValue ? ' 1' : '0');
      this.value = Boolean(parseInt(text));

      const textFn = () => {
        if (this.value == defaultValue) {
          return '';
        } else {
          return this.value ? '1' : '0';
        }
      };
      persistenceManager.manage(this.id, this.stream, textFn, text => {
        this.value = text ? text == '1' : defaultValue;
      });
    } else {
      this.value = defaultValue;
    }
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
