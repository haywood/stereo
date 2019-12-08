export class Controls {
    readonly domElement = document.createElement('form');

    constructor() {

    }
}

class Control {
    constructor(readonly name: string, public value: string) { }
}