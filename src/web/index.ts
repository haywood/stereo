import 'multirange/multirange.css';

import './global.scss';

import { dataStream } from './data';
import debug from './debug';
import { Overlay } from './overlay';
import { initRenderer, updateRenderer } from './renderer';

const cursorInactiveTimeout = 1000;
const overlay = new Overlay();
let lastMouseMove = 0;

const maybeSetCursorInactive = () => {
  if (Date.now() < lastMouseMove + cursorInactiveTimeout) return;
  if (overlay.hasAttention()) return;

  document.body.classList.add('cursor-inactive');
  overlay.hide();
};

document.body.onmousemove = () => {
  overlay.show();

  if (document.body.classList.contains('cursor-inactive')) {
    document.body.classList.remove('cursor-inactive');
  }

  lastMouseMove = Date.now();
  setTimeout(() => maybeSetCursorInactive(), cursorInactiveTimeout);
};

document.onreadystatechange = async () => {
  if (document.readyState !== 'complete') return;

  const canvas = document.querySelector('canvas').transferControlToOffscreen();
  await initRenderer(canvas);

  dataStream.subscribe(
    async data => {
      await updateRenderer(data);
      debug('data', data);
      document.body.classList.add('data');
      maybeSetCursorInactive();
    },
    (err: Error) => alert(`${err.message}\n${err.stack}`)
  );
};
