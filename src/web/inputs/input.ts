import { Subject, BehaviorSubject } from 'rxjs';
import { Change } from './change';
import { Options } from './options';
import { persistenceEnabled, hash } from './constants';

export abstract class Input<T, E extends HTMLElement = HTMLElement> {
  readonly disabled: boolean;

  protected readonly stringify: (t: T) => string;
  protected el?: E;

  private readonly subject: Subject<Change<T>>;
  private readonly persistent: boolean;

  constructor(
    readonly id: string,
    private _value: T,
    {
      persistent = false,
      disabled = false,
      stringify = () => {
        throw new Error('stringify unsupported');
      },
    }: Options<T> = {},
  ) {
    this.persistent = persistent;
    this.disabled = disabled;
    this.stringify = stringify;

    if (persistenceEnabled) {
      this.initFromOrWriteToHash();
    } else {
      this.persistent = false;
    }

    this.subject = this.newSubject();
  }

  initFromOrWriteToHash = () => {
    if (this.persistent && hash.has(this.id)) {
      this._value = this.parse(hash.get(this.id));
    } else if (this.persistent) {
      this.updateHash();
    }
  };

  newSubject = () => new BehaviorSubject({ newValue: this._value });

  setup = (el: E) => {
    this.el = el;
    if (this.disabled) this.el.classList.add('disabled');
    this._setup();
  };

  protected abstract _setup(): void;

  protected parse(str: string): T {
    throw new Error('parse unsupported');
  }

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
