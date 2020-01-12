import 'multirange/multirange.css';

import './global.scss';

import { Transfer } from 'threads';

import { dataStream } from './data';
import debug from './debug';
import { overlay } from './overlay';
import { renderThreadPromise } from './renderer';

const cursorInactiveTimeout = 1000;
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
    const renderThread = await renderThreadPromise;
    document.body.appendChild(overlay.domElement);

    const offscrenCanvas = document
      .querySelector('canvas')
      .transferControlToOffscreen();

    await renderThread.init(
      Transfer(offscrenCanvas as any), // cast to any because Transferable typedef is broken
      window.innerWidth,
      window.innerHeight
    );

    window.onresize = () => {
      renderThread.resize(window.innerWidth, window.innerHeight);
    };

    dataStream.subscribe(
      async data => {
        await renderThread.update(data);
        debug('data', data);
        document.body.classList.add('data');
        maybeSetCursorInactive();
      },
      (err: Error) => alert(`${err.message}\n${err.stack}`)
    );
  }
};
