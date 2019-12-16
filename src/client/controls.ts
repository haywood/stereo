import { inputs, streams, Inputs } from './inputs';

export class Controls {
    readonly domElement = document.createElement('form');

    constructor() {
        this.domElement.style.position = 'absolute';
        this.domElement.style.bottom = '0';
        this.domElement.style.right = '0';
        this.domElement.style.padding = '8px';
        this.domElement.style.color = 'white';
        this.domElement.style.display = 'flex';
        this.domElement.style.flexDirection = 'column';
        this.domElement.style.alignItems = 'flex-end';

        for (const name in inputs) {
            if (!(name in displayNames)) continue;

            const type = typeof inputs[name] === 'boolean' ? 'checkbox' : 'text';
            const input = new Control(name, type);
            this.domElement.appendChild(input.domElement);
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
    rate: 'Rate',
    f0: 'Rotation Basis 1',
    f1: 'Rotation Basis 2',
    h: 'Hue',
    l: 'Lightness',
    animate: 'Animate',
};

class Control {
    readonly domElement = document.createElement('span');

    constructor(readonly name: string, readonly type: string) {
        const input: HTMLInputElement = document.createElement('input');
        const value = inputs[name];

        input.name = name;
        input.type = type;
        if (type === 'checkbox') {
            input.checked = value;
        } else {
            input.value = value;
        }
        input.size = 50;
        input.onchange = () => {
            if (type === 'checkbox') {
                inputs[name] = input.checked;
            } else {
                inputs[name] = input.value;
            }
        };

        const label = document.createElement('label');
        label.innerText = displayNames[name];
        label.style.paddingRight = '8px';
        this.domElement.appendChild(label).appendChild(input);

        streams[name].subscribe(({ event, newValue }) => {
            if (event) return;
            if (type === 'checkbox') {
                input.checked = newValue;
            } else {
                input.value = newValue.toString();
            }
        });
    }
}
