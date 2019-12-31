import { values, streams, Inputs } from './inputs';
import enterFullscreenImage from './fullscreen.png';
import exitFullscreenImage from './fullscreen_exit.png';

export class Controls {
    readonly domElement = document.createElement('div');

    constructor() {
        this.domElement.style.boxSizing = 'border-box';
        this.domElement.style.position = 'absolute';
        this.domElement.style.top = '0';
        this.domElement.style.right = '0';
        this.domElement.style.padding = '16px';
        this.domElement.style.color = 'white';
        this.domElement.style.display = 'flex';
        this.domElement.style.flexFlow = 'column wrap';
        this.domElement.style.justifyContent = 'flex-start';
        this.domElement.style.alignItems = 'flex-end';
        this.domElement.style.zIndex = '1';
        this.domElement.style.opacity = '0';

        this.domElement.onmouseover = () => {
            this.domElement.style.opacity = '1';
        };

        this.domElement.onmouseout = () => {
            this.domElement.style.opacity = '0';
        };

        for (const name in values) {
            if (!(name in displayNames)) continue;

            const type = typeof values[name] === 'boolean' ? 'checkbox' : 'text';
            const input = new Control(name, type);
            this.domElement.appendChild(input.domElement);
        }

        if (document.fullscreenEnabled) {
            const button = document.createElement('input');
            button.type = 'image';
            button.src = enterFullscreenImage;
            button.style.padding = '8px';
            button.onclick = () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    button.src = enterFullscreenImage;
                } else {
                    document.body.requestFullscreen();
                    button.src = exitFullscreenImage;
                }
            };
            this.domElement.appendChild(button);
        }
    }

    append(...children: { domElement: Element; }[]) {
        children.forEach(c => this.domElement.appendChild(c.domElement));
    }
}

type DisplayNames = {
    [P in keyof Inputs]?: string;
};
const displayNames: DisplayNames = {
    pipe: 'Pipe Spec',
    theta: 'Theta',
    h: 'Hue',
    l: 'Lightness',
    animate: 'Animate',
    sound: '🎙️',
};

class Control {
    readonly domElement = document.createElement('span');

    constructor(readonly name: string, readonly type: 'text' | 'checkbox') {
        const input: HTMLInputElement = document.createElement('input');
        const value = values[name];

        this.domElement.style.padding = '8px';

        input.name = name;
        input.type = type;
        if (type === 'checkbox') {
            input.checked = value;
        } else {
            input.value = value;
            input.size = value.length;
        }
        input.style.margin = '0px 8px';
        input.onchange = () => {
            if (type === 'checkbox') {
                values[name] = input.checked;
            } else {
                values[name] = input.value;
                input.size = input.value.length;
            }
        };

        const label = document.createElement('label');
        label.innerText = displayNames[name];
        if (type === 'checkbox') label.style.cursor = 'pointer';

        this.domElement.appendChild(label).appendChild(input);

        streams[name].subscribe(({ event, newValue }) => {
            if (event) return;
            if (type === 'checkbox') {
                input.checked = newValue;
            } else {
                input.value = newValue.toString();
                input.size = newValue.length;
            }
        });
    }
}
