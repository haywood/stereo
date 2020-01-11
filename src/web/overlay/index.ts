import './overlay.scss';

import assert from 'assert';

import { inputs } from '../inputs';
import html from './overlay.html';

class Overlay {
  readonly domElement = document.createElement('div');
  private hasHover = false;

  constructor() {
    this.domElement.id = 'overlay';
    this.domElement.innerHTML = html;

    this.setupInputs();
    this.setupKeyboardShortcuts();

    this.domElement
      .querySelectorAll<HTMLElement>(
        'input, textarea, label, i, h2, h1, #allowed_db_range'
      )
      .forEach(el => {
        el.onmouseover = () => (this.hasHover = true);
        el.onmouseout = () => (this.hasHover = false);
      });
  }

  hasAttention = () => this.hasHover || this.contains(document.activeElement);

  show = () => (this.domElement.style.opacity = '1');

  hide = () => (this.domElement.style.opacity = '0');

  private contains = (node: Node) => this.domElement.contains(node);

  private setupInputs = () => {
    for (const input of Object.values(inputs)) {
      const el = this.querySelector<HTMLInputElement>(`#${input.id}`);
      assert(el, `Did not find element for input #${input.id}`);
      input.setup(el);
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

export const overlay = new Overlay();
