import 'multirange/multirange.css';

import './index.scss';

import { error } from './error';
import { ReplaySubject, combineLatest, interval } from 'rxjs';
import { Simplifier } from './pipe/simplifier';
import { audioStream } from './audio';
import { PipeNode } from './pipe/grammar.pegjs';
import debug from './debug';
import { inputs } from './inputs';
import { Change } from './inputs/change';
import { Overlay } from './overlay';
import { HSV } from './params';
import { Scope } from './params/scope';
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

const video = document.querySelector('video');
video.srcObject = (renderer.canvas as any).captureStream(1);

combineLatest(inputs.pipe.stream, inputs.theta.stream).subscribe(() => {
  const simplifier = new Simplifier({
    theta: inputs.theta.value
  });
  const pipe = simplifier.simplify(inputs.pipe.value);
  setPipe(pipe);
  debug('pipe', pipe);

  document.body.classList.add('data');
  maybeSetCursorInactive();
}, error);

combineLatest(
  inputs.h.stream,
  inputs.s.stream,
  inputs.v.stream,
  inputs.theta.stream
).subscribe(() => {
  const simplifier = new Simplifier({
    theta: inputs.theta.value
  });
  const hsv = {
    h: simplifier.simplify(inputs.h.value),
    s: simplifier.simplify(inputs.s.value),
    v: simplifier.simplify(inputs.v.value)
  };
  setHsv(hsv);
  debug('hsv', hsv);
}, error);

audioStream.subscribe(audio => {
  setScope({ audio });
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

function setPipe(pipe: PipeNode) {
  renderer.setPipe(pipe);
}

function setHsv(hsv: HSV) {
  renderer.setHsv(hsv);
}

function setScope(scope: Scope) {
  renderer.setScope(scope);
}
