import { inputs, ToggleInput, TextInput, RangeInput } from './inputs';
import html from './controls.html';
import './controls.scss';
import assert from 'assert';
import multirange from 'multirange';

export class Controls {
    readonly domElement = document.createElement('div');

    constructor() {
        this.domElement.id = 'controls';
        this.domElement.innerHTML = html;

        this.setupInputs();
        this.setupKeyboardShortcuts();
    }

    show = () => this.domElement.style.opacity = '1';

    hide = () => {
        if (!this.domElement.contains(document.activeElement)) {
            this.domElement.style.opacity = '0';
        }
    };

    private setupInputs = () => {
        for (const input of Object.values(inputs)) {
            if (input.disabled) continue;

            if (input instanceof TextInput) {
                this.setupText(input);
            } else if (input instanceof ToggleInput) {
                this.setupToggle(input);
            } else if (input instanceof RangeInput) {
                this.setupRange(input);
            }
        }

        if (!inputs.fullscreen.disabled) {
            inputs.fullscreen.stream.subscribe(({ newValue }) => {
                if (newValue) document.body.requestFullscreen();
                else if (document.fullscreenElement) document.exitFullscreen();
            });
        }
    };

    private querySelector = <E extends Element = HTMLElement>(selector: string) =>
        this.domElement.querySelector<E>(selector);

    private setupText = (text: TextInput) => {
        const el = this.querySelector<HTMLInputElement>(`#${text.id}`);
        assert(el, `Did not find element for input #${text.id}`);

        el.onchange = () => text.value = el.value;
        el.oninput = () => el.size = el.value.length;

        text.stream.subscribe(({ newValue }) => {
            el.value = newValue;
            el.size = newValue.length;
        });
    };

    private setupToggle = (toggle: ToggleInput) => {
        const on = this.querySelector(`#${toggle.on}`);
        const off = this.querySelector(`#${toggle.off}`);

        on.onclick = () => toggle.value = true;

        off.onclick = () => toggle.value = false;

        toggle.stream.subscribe(({ newValue }) => {
            if (newValue) {
                on.style.display = 'none';
                off.style.display = 'inline';
            } else {
                on.style.display = 'inline';
                off.style.display = 'none';
            }
        });
    };

    private setupRange = (range: RangeInput) => {
        const el = this.querySelector<HTMLInputElement>(`#${range.id}`);
        const input = el.querySelector<HTMLInputElement>('input');
        multirange(input);
        const minEl = el.querySelector<HTMLElement>('.min');
        const maxEl = el.querySelector<HTMLElement>('.max');

        input.onchange = () => {
            range.value = [+input.valueLow, +input.valueHigh];
        };

        el.querySelector<HTMLInputElement>('input.ghost').oninput = input.oninput = () => {
            minEl.innerText = input.valueLow;
            maxEl.innerText = input.valueHigh;
        };

        range.stream.subscribe(({ newValue }) => {
            input.value = range.stringify(newValue);
            minEl.innerText = input.valueLow;
            maxEl.innerText = input.valueHigh;
        });
    };

    private setupKeyboardShortcuts = () => {
        document.onkeydown = (event: KeyboardEvent) => {
            if (event.repeat) return;
            if (this.domElement.contains(event.target as Node)) return;

            switch (event.key) {
                case ' ':
                    inputs.animate.value = !inputs.animate.value;
                    break;
                case 'm':
                case 'M':
                    inputs.mic.value = !inputs.mic.value;
                    break;
                case 'Enter':
                    inputs.fullscreen.value = !inputs.fullscreen.value;
                    break;
            }
        };
    };
}
