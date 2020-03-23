import { StringStream } from 'codemirror';

import * as ast from './ast';

export function peek(pattern: any, stream: StringStream) {
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

function line(stream: StringStream) {
  return (stream as any).lineOracle?.line;
}
