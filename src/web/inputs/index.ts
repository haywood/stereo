import multirange from 'multirange';
import { BehaviorSubject, Subject } from 'rxjs';

import { poolSize } from '../../core/pipe/pool';
import debug from '../debug';
import { renderer } from '../renderer';

type Change<T> = {
  newValue: T;
  oldValue?: T;
  event?: Event;
};

const query = new URLSearchParams(window.location.search);
const persistenceEnabled = query.get('p') != '0';
const hash = (() => {
  const temp = window.location.hash.substr(1);
  return new URLSearchParams(temp ? atob(temp) : '');
})();

type Options<T> = {
  persistent?: boolean;
  disabled?: boolean;
  stringify?: (t: T) => string;
};
export abstract class AbstractInput<T, E extends HTMLElement = HTMLElement> {
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

type TextInputId = 'pipe' | 'theta' | 'h' | 'v';

export class TextInput extends AbstractInput<
  string,
  HTMLInputElement | HTMLTextAreaElement
> {
  constructor(
    readonly id: TextInputId,
    _value: string,
    { persistent = true, disabled = false, stringify = (s: string) => s } = {},
  ) {
    super(id, _value, { persistent, disabled, stringify });
  }

  protected _setup = () => {
    this.el.disabled = this.disabled;

    this.el.onchange = () => {
      this.el.value = this.stringify(this.el.value);
      this.value = this.el.value;
    };

    this.el.oninput = () => this.setSize();

    this.stream.subscribe(({ newValue }) => {
      this.el.value = this.stringify(newValue);
      this.setSize();
    });
  };

  private setSize() {
    if (this.el instanceof HTMLInputElement)
      this.el.size = this.el.value.length;
    else {
      const lines = this.el.value.split('\n');
      this.el.rows = Math.min(10, lines.length);
      this.el.cols = Math.min(
        50,
        lines.reduce((max, line) => Math.max(max, line.length), 0),
      );
    }
  }

  protected parse(str: string) {
    return str;
  }
}

type ToggleInputId = 'animate' | 'mic' | 'fullscreen';

export class ToggleInput extends AbstractInput<boolean> {
  constructor(
    readonly id: ToggleInputId,
    _value: boolean,
    { disabled = false, persistent = false } = {},
  ) {
    super(id, _value, {
      persistent,
      disabled,
      stringify: (bool: boolean) => {
        return bool ? '1' : '0';
      },
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

  protected parse(str: string) {
    if (/1|true/i.test(str)) return true;
    else if (/0|false/i.test(str)) return false;
    else throw new Error(`invalid boolean value for input ${this.id}: ${str}`);
  }
}

type RangeInputId = 'allowed_db_range';

export class RangeInput extends AbstractInput<[number, number]> {
  constructor(
    readonly id: RangeInputId,
    _value: [number, number],
    { disabled = false, persistent = true } = {},
  ) {
    super(id, _value, {
      disabled,
      persistent,
      stringify: ([min, max]) => {
        return `${min},${max}`;
      },
    });
  }

  protected _setup = () => {
    const input = this.el.querySelector<MultirangeHTMLInputElement>('input');
    input.disabled = this.disabled;
    multirange(input);
    const minEl = this.el.querySelector<HTMLElement>('.min');
    const maxEl = this.el.querySelector<HTMLElement>('.max');

    input.onchange = () => {
      this.value = [+input.valueLow, +input.valueHigh];
    };

    this.el.querySelector<HTMLInputElement>(
      'input.ghost',
    ).oninput = input.oninput = () => {
      minEl.innerText = input.valueLow.toString();
      maxEl.innerText = input.valueHigh.toString();
    };

    this.stream.subscribe(({ newValue }) => {
      input.value = this.stringify(newValue);
      minEl.innerText = input.valueLow.toString();
      maxEl.innerText = input.valueHigh.toString();
    });
  };

  protected parse(str: string): [number, number] {
    const [min, max] = str.split(/,/);
    return [parseInt(min), parseInt(max)];
  }
}

export class ActionInput extends AbstractInput<void> {
  constructor(id: string, private readonly action: (ev: MouseEvent) => void) {
    super(id, null);
  }

  protected _setup = () => {
    if (!this.disabled) this.el.onclick = ev => this.action(ev);
  };
}

// Points generation is done in parallel, so pick n such
// that each chunk is size 2000
const n = 2000 * poolSize;

export const inputs = {
  pipe: new TextInput(
    'pipe',
    `
    ${n}
      ->3
      ->torus(1, 1)
      ->R(theta, 0, 1, cos, tan)
      ->R(theta, 0, 2)
      ->R(theta, 0, 3)
      ->stereo(3)`,
    {
      persistent: true,
      stringify: text => text.replace(/\s*(->|=>)\s*/g, '\n  ->').trim(),
    },
  ),
  theta: new TextInput('theta', 'pi * power + pi * t / 20'),
  h: new TextInput('h', 'chroma * abs(p[0])'),
  v: new TextInput('v', '(power + onset) / 2'),
  animate: new ToggleInput('animate', true),
  mic: new ToggleInput('mic', false, {
    disabled: !new AudioContext().audioWorklet,
  }),
  fullscreen: new ToggleInput('fullscreen', false, {
    disabled: !document.fullscreenEnabled,
  }),
  allowedDbs: new RangeInput('allowed_db_range', [-130, -30], {
    disabled: !new AudioContext().audioWorklet,
  }),
  save: new ActionInput('save', async () => {
    const canvas = renderer.domElement;
    renderer.render();
    const blob = await new Promise(resolve => canvas.toBlob(resolve));
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.download = `stereo${document.location.hash}`;
      a.href = url;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }),
};
export type Inputs = typeof inputs;

debug('inputs', inputs);
