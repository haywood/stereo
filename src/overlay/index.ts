import assert from 'assert';

import sf from 'screenfull';

import { inputs } from '../inputs';
import {shortcuts} from './shortcuts';
import { cursorManager } from './cursor_manager';

// The types for this library are kinda fucked up
const screenfull = sf as sf.Screenfull;

export class Overlay {
  readonly domElement = document.getElementById('overlay');
  private hasHover = false;

  constructor() {
    this.setupInputs();
    this.setupShortcuts();
    this.setupCursorManagement();

    const ids = Object.values(inputs).map(i => `#${i.id}`);
    this.domElement
      .querySelectorAll<HTMLElement>(`i, h2, h1, a, ${ids.join(', ')}`)
      .forEach(el => {
        el.onmouseover = () => (this.hasHover = true);
        el.onmouseout = () => (this.hasHover = false);
        el.onfocus = () => this.show();
      });
  }

  private setupInputs() {
    for (const name in inputs) {
      const input = inputs[name];
      const el = this.domElement.querySelector(`#${input.id}`);
      assert(el, `Did not find element for input #${input.id}`);
      input.setup(el);
    }

    if (screenfull.isEnabled) {
      screenfull.on('change', () => {
        inputs.fullscreen.value = screenfull.isFullscreen;
      });

      inputs.fullscreen.stream.subscribe(({ newValue }) => {
        if (newValue == screenfull.isFullscreen) return;
        else if (newValue) screenfull.request();
        else if (screenfull.element) screenfull.exit();
      });
    }
  }

  private setupShortcuts() {
    document.onkeydown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (this.domElement.contains(event.target as Node)) return;

      const shortcut = shortcuts[event.key];
      if (shortcut) shortcut();
    };
  }

  private setupCursorManagement() {
    cursorManager.onActive(this.show);
    cursorManager.onInActive(this.maybeHide);
  }

  private readonly show = () => {
    this.domElement.style.opacity = '1';
  };

  private readonly maybeHide = () => {
    if (this.hasAttention()) return;
    this.domElement.style.opacity = '0';
  };

  private hasAttention() {
    return this.hasHover || this.contains(document.activeElement);
  }

  private contains = (node: Node) => this.domElement.contains(node);
}
