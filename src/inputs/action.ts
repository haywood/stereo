import { Input } from './input';

export class ActionInput extends Input<void> {
  constructor(id: string) {
    super(id, { parse: () => {} });
  }

  protected _setup = () => {
    if (!this.disabled) {
      this.el.onclick = () => {
        this.value = null;
      };
    }
  };
}
