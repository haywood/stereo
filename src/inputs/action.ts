import { Input } from './input';

export class ActionInput extends Input<void> {
  constructor(id: string, private readonly action: (ev: MouseEvent) => void) {
    super(id, '', { parse: () => {} });
  }

  protected _setup = () => {
    if (!this.disabled) this.el.onclick = ev => this.action(ev);
  };
}
