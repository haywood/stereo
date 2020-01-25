import 'multirange/multirange.css';
import { dataStream } from './data';
import debug from './debug';
import './index.scss';
import { Overlay } from './overlay';
import { initRenderer, updateRenderer } from './renderer';

const cursorInactiveTimeout = 1000;
const overlay = new Overlay();
let lastMouseMove = 0;

const maybeSetCursorInactive = () => {
  if (Date.now() < lastMouseMove + cursorInactiveTimeout) return;
  document.body.classList.add('cursor-inactive');

  overlay.maybeHide();
};

document.body.onmousemove = () => {
  overlay.onmousemove();

  if (document.body.classList.contains('cursor-inactive')) {
    document.body.classList.remove('cursor-inactive');
  }

  lastMouseMove = Date.now();
  setTimeout(() => maybeSetCursorInactive(), cursorInactiveTimeout);
};

document.onreadystatechange = async () => {
  if (document.readyState !== 'complete') return;

  const canvas = document.querySelector('canvas');
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
