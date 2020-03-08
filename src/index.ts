import 'codemirror/lib/codemirror.css';
import 'multirange/multirange.css';

import { ReplaySubject, combineLatest, interval } from 'rxjs';

import { audioStream } from './audio';
import debug from './debug';
import { error } from './error';
import { inputs } from './inputs';
import { Change } from './inputs/change';
import { Overlay } from './overlay';
import { renderer } from './renderer';
import { HSV, Scope } from './types';

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

inputs.pipe.stream.subscribe(({ newValue: pipe }) => {
  renderer.setPipe(pipe);
  debug('pipe', pipe);

  document.body.classList.add('data');
  maybeSetCursorInactive();
}, error);

combineLatest(inputs.h.stream, inputs.s.stream, inputs.v.stream).subscribe(
  () => {
    const hsv = {
      h: inputs.h.value,
      s: inputs.s.value,
      v: inputs.v.value
    };
    renderer.setHsv(hsv);
    debug('hsv', hsv);
  },
  error
);

audioStream.subscribe(audio => {
  renderer.setScope({ audio });
  debug('audio', audio);
}, error);

inputs.save.stream.subscribe(async () => {
  const blob = await renderer.renderPng();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.download = `stereo${document.location.hash}`;
    a.href = url;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
});

window.onresize = () => renderer.setSize();
