import 'multirange/multirange.css';

import './global.scss';

import { dataStream } from './data';
import debug from './debug';
import { Overlay } from './overlay';
import { initRenderer, updateRenderer } from './renderer';

const cursorInactiveTimeout = 1000;
const overlay = new Overlay();
let lastMouseMove = 0;

const maybeSetCursorInactive = (event?) => {
  if (Date.now() < lastMouseMove + cursorInactiveTimeout) return;
  if (overlay.hasAttention()) return;

  document.body.classList.add('cursor-inactive');
  overlay.hide();
};

document.body.onmousemove = event => {
  overlay.show();

  if (document.body.classList.contains('cursor-inactive')) {
    document.body.classList.remove('cursor-inactive');
  }

  lastMouseMove = Date.now();
  setTimeout(() => maybeSetCursorInactive(event), cursorInactiveTimeout);
};

document.onreadystatechange = async () => {
  if (document.readyState === 'complete') {
    document.body.appendChild(overlay.domElement);

    await initRenderer(
      document.querySelector('canvas').transferControlToOffscreen()
    );

    dataStream.subscribe(
      async data => {
        await updateRenderer(data);
        debug('data', data);
        document.body.classList.add('data');
        maybeSetCursorInactive();
      },
      (err: Error) => alert(`${err.message}\n${err.stack}`)
    );
  }
};
