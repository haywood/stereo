import { Overlay } from './overlay';
import { start } from './renderer';

const cursorInactiveTimeout = 1000;
const overlay = new Overlay();
let lastMouseMove = 0;

const maybeSetCursorInactive = () => {
  if (Date.now() < lastMouseMove + cursorInactiveTimeout) return;
  document.body.classList.add('cursor-inactive');

  overlay.maybeHide();
};

document.body.onclick =
document.body.onmousemove = function evaluateCursorState() {
  overlay.show();

  if (document.body.classList.contains('cursor-inactive')) {
    document.body.classList.remove('cursor-inactive');
  }

  lastMouseMove = Date.now();
  setTimeout(() => maybeSetCursorInactive(), cursorInactiveTimeout);
};


start();
