import { BehaviorSubject, Subject } from 'rxjs';
import { Change } from './change';
import { hash, persistenceEnabled } from './constants';
import { Options } from './options';

export abstract class Input<T, E extends HTMLElement = HTMLElement> {
  readonly disabled: boolean;

  protected readonly parse: (s: string) => T;
  protected readonly stringify: (t: T) => string;
  protected el?: E;
  protected readonly initialText: string;

  private readonly subject: Subject<Change<T>>;
  private readonly persistent: boolean;
  private _value: T;

  constructor(
    readonly id: string,
    defaultText: string,
    {
      persistent = false,
      disabled = false,
      parse = () => {
        throw new Error('parse unsupported');
      },
      stringify = () => {
        throw new Error('stringify unsupported');
      }
    }: Options<T> = {}
  ) {
    this.persistent = persistent;
    this.disabled = disabled;
    this.parse = parse;
    this.stringify = stringify;

    if (!persistenceEnabled) {
      this.persistent = false;
    }
    let text = defaultText;
    if (this.persistent && hash.has(this.id)) {
      text = hash.get(this.id);
    }

    this.initialText = text;
    this._value = this.parse(text);
    this.subject = this.newSubject();
  }

  protected newSubject(): Subject<Change<T>> {
    return new BehaviorSubject<Change<T>>({ newValue: this._value });
  }

  setup = (el: E) => {
    this.el = el;
    if (this.disabled) this.el.classList.add('disabled');
    this._setup();
  };

  protected abstract _setup(): void;

  get stream() {
    return this.subject.asObservable();
  }

  get value() {
    return this._value;
  }

  set value(newValue: T) {
    const oldValue = this.value;
    this._value = newValue;
    this.subject.next({ newValue, oldValue, event: window.event });
    if (this.persistent) this.updateHash();
  }

  private updateHash = () => {
    const str = this.stringify(this.value);
    hash.set(this.id, str);
    document.location.hash = btoa(hash.toString());
  };
}
