import assert from 'assert';

import * as sf from 'screenfull';

import { inputs } from '../inputs';

// The types for this library are kinda fucked up
const screenfull = sf as sf.Screenfull;

export class Overlay {
  readonly domElement = document.getElementById('overlay');
  private hasHover = false;

  constructor() {
    this.setupInputs();
    this.setupKeyboardShortcuts();

    const ids = Object.values(inputs).map(i => `#${i.id}`);
    this.domElement
      .querySelectorAll<HTMLElement>(`i, h2, h1, a, ${ids.join(', ')}`)
      .forEach(el => {
        el.onmouseover = () => (this.hasHover = true);
        el.onmouseout = () => (this.hasHover = false);
      });

    this.inputs()
      .querySelectorAll('input')
      .forEach(el => {
        el.oninvalid = this.show;
      });
  }

  private inputs() {
    return this.querySelector<HTMLElement>('#inputs');
  }

  onmousemove = () => {
    this.show();
  };

  private show = () => {
    this.domElement.style.opacity = '1';
  };

  maybeHide = () => {
    if (this.hasAttention()) return;
    this.domElement.style.opacity = '0';
  };

  private hasAttention = () =>
    this.hasHover || this.contains(document.activeElement);

  private contains = (node: Node) => this.domElement.contains(node);

  private setupInputs = () => {
    for (const input of Object.values(inputs)) {
      const el = this.querySelector<HTMLTextAreaElement>(`#${input.id}`);
      assert(el, `Did not find element for input #${input.id}`);
      input.setup(el);
    }

    if (screenfull.isEnabled) {
      inputs.fullscreen.stream.subscribe(({ newValue }) => {
        if (newValue) screenfull.request();
        else if (screenfull.element) screenfull.exit();
      });
    }
  };

  querySelector = <E extends Element = HTMLElement>(selector: string) =>
    this.domElement.querySelector<E>(selector);

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
