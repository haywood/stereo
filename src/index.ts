import 'multirange/multirange.css';

import './index.scss';

import debug from './debug';
import { Overlay } from './overlay';
import { paramsStream } from './params/stream';
import { renderer } from './renderer';

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

  const video = document.querySelector('video');
  video.srcObject = (renderer.canvas as any).captureStream(1);

  paramsStream.subscribe(
    params => {
      debug('params', params);
      renderer.update(params);
      document.body.classList.add('data');
      maybeSetCursorInactive();
    },
    (err: Error) => alert(`${err.message}\n${err.stack}`)
  );
};
