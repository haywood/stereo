import { Subject, BehaviorSubject } from 'rxjs';

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

export abstract class Input<T> {
    private readonly subject: Subject<Change<T>>;

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
        if (this.persistent) {
            const str = this.stringify(newValue);
            localStorage.setItem(`inputs.${this.id}`, str);
            this.updateHash();
        }
    }

    private updateHash = () => {
        const str = this.stringify(this.value);
        hash.set(this.id, str);
        document.location.hash = btoa(hash.toString());

    };
}

type TextInputId = 'pipe' | 'theta' | 'h' | 'v';

export class TextInput extends Input<string> {
    readonly disabled = false;

    constructor(
        readonly id: TextInputId,
        _value: string,
        persistent: boolean = true,
    ) {
        super(id, _value, persistent);
    }

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

    protected parse(str: string) {
        if (/1|true/i.test(str)) return true;
        else if (/0|false/i.test(str)) return false;
        else throw new Error(`invalid boolean value for input ${this.id}: ${str}`);
    };

    protected stringify(bool: boolean) {
        return bool ? '1' : '0';
    }
}


type RangeInputId = 'allowed_dbs';

export class RangeInput extends Input<[number, number]> {
    constructor(
        readonly id: RangeInputId,
        _value: [number, number],
        readonly disabled: boolean = false,
        persistent: boolean = true,
    ) {
        super(id, _value, persistent);
    }

    parse(str: string): [number, number] {
        const [min, max] = str.split(/,/);
        return [parseInt(min), parseInt(max)];
    }

    stringify([min, max]) {
        return `${min},${max}`;
    }
}

export const inputs = {
    pipe: new TextInput(
        'pipe',
        '10000->sphere(4, 1)->R(theta, 0, 1, cos, tan)->R(theta, 0, 2)->R(theta, 0, 3)->stereo(3)',
    ),
    theta: new TextInput('theta', 'pi * (t + power) / 20'),
    h: new TextInput('h', 'chroma * (i + 1) / n'),
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
    allowedDbs: new RangeInput('allowed_dbs', [-70, -30]),
};
export type Inputs = typeof inputs;

window.inputs = inputs;
