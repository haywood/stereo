import { Subject } from 'rxjs';
import { Change } from './change';
import { Input } from './input';

export class ActionInput extends Input<void> {
  constructor(id: string, private readonly action: (ev: MouseEvent) => void) {
    super(id, '', { parse: () => {} });
  }

  protected _setup = () => {
    if (!this.disabled) {
      this.el.onclick = () => {
        this.value = null;
      };
    }
  };

  protected newSubject() {
    return new Subject<Change<void>>();
  }
}
