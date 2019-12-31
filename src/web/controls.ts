import { inputs, ToggleInput, TextInput } from './inputs';
import html from './controls.html';
import './controls.scss';
import assert from 'assert';

export class Controls {
    readonly domElement = document.createElement('div');
    private hasMouse: boolean = false;

    constructor() {
        this.domElement.id = 'controls';
        this.domElement.innerHTML = html;

        this.setupInputs();
        this.setupShowHideHandlers();
        this.setupKeyboardShortcuts();

        document.onclick = (event) => {
            if (!this.domElement.contains(event.target as Node)) {
                inputs.animate.value = !inputs.animate.value;
            }
        };
    }

    private setupInputs = () => {
        for (const input of Object.values(inputs)) {
            if (input.disabled) continue;

            if (input instanceof TextInput) {
                this.setupText(input);
            } else if (input instanceof ToggleInput) {
                this.setupToggle(input);
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

    private setupShowHideHandlers = () => {
        document.onmousemove = this.onmousemove;

        this.domElement.onmouseover = () => this.hasMouse = true;
        this.domElement.onmouseout = () => this.hasMouse = false;
    };

    private setupKeyboardShortcuts = () => {
        document.onkeydown = (event: KeyboardEvent) => {
            if (event.repeat) return;
            if (this.domElement.contains(event.target as Node)) return;

            if (event.key === ' ') {
                inputs.animate.value = !inputs.animate.value;
            }
        };
    };

    private onmousemove = () => {
        if (this.domElement.style.opacity == '1') {
            setTimeout(this.maybeHide, 1000);
        } else {
            this.domElement.style.opacity = '1';
        }
    };

    private maybeHide = () => {
        if (this.hasMouse) return;
        if (this.domElement.contains(document.activeElement)) return;

        this.domElement.style.opacity = '0';
    };
}
