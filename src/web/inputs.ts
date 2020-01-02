import { Subject, BehaviorSubject } from 'rxjs';
import { poolSize } from '../core/pipe/pool';
import debug from './debug';
import multirange from 'multirange';

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

export abstract class Input<T, E = HTMLElement> {
    private readonly subject: Subject<Change<T>>;
    protected el?: E;

    constructor(
        readonly id: string,
        private _value: T,
        private readonly persistent: boolean
    ) {
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
        this._setup();
    };

    protected abstract _setup(): void;

    protected abstract parse(str: string): T;
    protected abstract stringify(value: T): string;

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

export class TextInput extends Input<string, HTMLInputElement> {
    readonly disabled = false;

    constructor(
        readonly id: TextInputId,
        _value: string,
        persistent: boolean = true,
    ) {
        super(id, _value, persistent);
    }

    protected _setup = () => {
        this.el.onchange = () => this.value = this.el.value;
        this.el.oninput = () => this.el.size = this.el.value.length;

        this.stream.subscribe(({ newValue }) => {
            this.el.value = newValue;
            this.el.size = newValue.length;
        });
    };

    protected parse(str: string) {
        return str;
    }

    protected stringify(text: string) {
        return text;
    }
}

type ToggleInputId = 'animate' | 'mic' | 'fullscreen';

export class ToggleInput extends Input<boolean> {
    constructor(
        readonly id: ToggleInputId,
        _value: boolean,
        readonly on: string,
        readonly off: string,
        readonly disabled: boolean = false,
        persistent: boolean = true,
    ) {
        super(id, _value, persistent);
    }

    protected _setup = () => {
        const on = this.el.querySelector<HTMLInputElement>('.on');
        on.onclick = () => this.value = true;

        const off = this.el.querySelector<HTMLInputElement>('.off');
        off.onclick = () => this.value = false;

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
    };

    protected stringify(bool: boolean) {
        return bool ? '1' : '0';
    }
}


type RangeInputId = 'allowed_db_range';

export class RangeInput extends Input<[number, number]> {
    constructor(
        readonly id: RangeInputId,
        _value: [number, number],
        readonly disabled: boolean = false,
        persistent: boolean = true,
    ) {
        super(id, _value, persistent);
    }

    protected _setup = () => {
        const input = this.el.querySelector<MultirangeHTMLInputElement>('input');
        multirange(input);
        const minEl = this.el.querySelector<HTMLElement>('.min');
        const maxEl = this.el.querySelector<HTMLElement>('.max');

        input.onchange = () => {
            this.value = [+input.valueLow, +input.valueHigh];
        };

        this.el.querySelector<HTMLInputElement>('input.ghost').oninput = input.oninput = () => {
            minEl.innerText = input.valueLow.toString();
            maxEl.innerText = input.valueHigh.toString();
        };

        this.stream.subscribe(({ newValue }) => {
            input.value = this.stringify(newValue);
            minEl.innerText = input.valueLow.toString();
            maxEl.innerText = input.valueHigh.toString();
        });
    };

    parse(str: string): [number, number] {
        const [min, max] = str.split(/,/);
        return [parseInt(min), parseInt(max)];
    }

    stringify([min, max]) {
        return `${min},${max}`;
    }
}

// Points generation is done in parallel, so pick n such
// that each chunk is size 1000
const n = 1000 * poolSize;

export const inputs = {
    pipe: new TextInput(
        'pipe',
        `${n}->sphere(4, 1)->R(theta, 0, 1, cos, tan)->R(theta, 0, 2)->R(theta, 0, 3)->stereo(3)`,
    ),
    theta: new TextInput('theta', 'pi * (t + power) / 20'),
    h: new TextInput('h', 'chroma * i / (n - 1)'),
    v: new TextInput('v', 'power'),
    animate: new ToggleInput('animate', true, 'play', 'pause', false, true),
    mic: new ToggleInput('mic', false, 'mic', 'mic_off', false, false),
    fullscreen: new ToggleInput(
        'fullscreen',
        false,
        'enter_fullscreen',
        'exit_fullscreen',
        !document.fullscreenEnabled,
        false,
    ),
    allowedDbs: new RangeInput('allowed_db_range', [-100, -30]),
};
export type Inputs = typeof inputs;

debug.inputs = inputs;
