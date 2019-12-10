import { q, streams, Q } from './query';

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

        for (const name in q) {
            const input = new Input(name, 'text', q[name], value => value);
            this.domElement.appendChild(input.domElement);
        }
    }

    append(...children: { domElement: Element }[]) {
        children.forEach(c => this.domElement.appendChild(c.domElement));
    }
}

class Input<T> {
    readonly domElement = document.createElement('span');

    constructor(readonly name: string, readonly type: string, public value: string, parse: (value: string) => T) {
        const input = document.createElement('input');
        input.name = name;
        input.type = type;
        input.value = value;
        input.size = 50;
        input.onchange = () => {
            q[name] = parse(input.value);
        };
        const label = document.createElement('label');
        label.innerText = name;
        label.style.paddingRight = '8px';
        this.domElement.appendChild(label);
        this.domElement.appendChild(input);

        streams[name].subscribe(({ event, value }) => {
            if (!!event) input.value = value.toString();
        })
    }
}