import { ReplaySubject } from 'rxjs';

import { Change } from './change';
import { Options } from './options';

export abstract class Input<T, E extends HTMLElement = HTMLElement> {
  readonly disabled: boolean;

  private _el: E;

  private readonly subject = new ReplaySubject<Change<T>>();
  private _value: T;

  constructor(
    readonly id: string,
    { disabled }: Options<T> = { disabled: false }
  ) {
    this.disabled = disabled;
  }

  protected get el() {
    return this._el;
  }

  setup = (el: E) => {
    // Wrap in try/catch so that invalid data doesn't break the whole page.
    if (this.disabled) el.classList.add('disabled');

    try {
      this._el = el;
      this._setup();
    } catch (e) {
      console.error(e);
    }
  };

  protected abstract _setup(): void;

  get stream() {
    return this.subject.asObservable();
  }

  get value() {
    return this._value;
  }

  set value(newValue: T) {
    if (this.disabled) {
      console.error('attempt to set disabled input', { input: this, newValue });
      throw new Error(
        `attempt to set disabled input ${this.id} to ${newValue}`
      );
    }

    const oldValue = this.value;
    this._value = newValue;
    this.subject.next({ newValue, oldValue, event: window.event });
  }
}
