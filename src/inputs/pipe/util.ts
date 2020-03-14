import { Pos, StringStream } from 'codemirror';
import cm from 'codemirror';
import { isEqual } from 'lodash';

import * as ast from './ast';
import { State } from './state';

export function peek(pattern, stream: StringStream) {
  return stream.match(pattern, false);
}

export function loc(stream: StringStream, src: string): ast.Location {
  const start = pos(stream, src);
  const end = start;
  return { start, end };
}

export function pos(stream: StringStream, src: string): number {
  let pos = 0;

  src.split('\n').forEach((text, i) => {
    if (i < line(stream)) {
      pos += text.length + 1;
    } else if (i == line(stream)) {
      pos += stream.pos;
      return;
    }
  });

  return pos;
}

export function eoi(stream: StringStream, src: string) {
  return pos(stream, src) == src.length;
}

export function complete(state: State, stream: StringStream, src: string) {
  const {
    location: { start, end }
  } = state;

  return start == 0 && end == src.length;
}

function line(stream: StringStream) {
  return (stream as any).lineOracle?.line;
}
