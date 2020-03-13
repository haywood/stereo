import { Pos, StringStream } from 'codemirror';
import cm from 'codemirror';
import { isEqual } from 'lodash';

import * as ast from './ast';
import { State } from './state';

export function peek(pattern, stream: StringStream) {
  return stream.match(pattern, false);
}

export function loc(stream: StringStream): ast.Location {
  const start = pos(stream);
  const end = start;
  return { start, end };
}

export function pos(stream: StringStream): number {
  const doc = lineOracle(stream).doc as cm.Doc;
  let pos = 0;

  doc.getValue().split('\n').forEach((text, i) => {
    if (i < line(stream)) {
      pos += text.length + 1;
    } else if (i == line(stream)) {
      pos += stream.pos;
      return;
    }
  });

  return pos;
}

export function eoi(stream: StringStream) {
  return pos(stream) == lineOracle(stream).doc.getValue().length;
}

export function complete(state: State, stream: StringStream) {
  const doc = lineOracle(stream).doc as cm.Doc;
  const {
    location: { start, end }
  } = state;

  return start == 0 && end == doc.getValue().length;
}

function line(stream: StringStream) {
  return lineOracle(stream)?.line;
}

function lines(stream: StringStream) {
  return lineOracle(stream).doc.size;
}

function length(stream: StringStream, line: number) {
  return doc(stream).lineInfo(line).text.length;
}

function doc(stream: StringStream) {
  return lineOracle(stream).doc;
}

function lineOracle(stream: StringStream) {
  return (stream as any).lineOracle;
}
