import cm from 'codemirror';

import * as ast from './ast';

export function peek(pattern: any, stream: cm.StringStream) {
  return stream.match(pattern, false);
}

export function loc(stream: cm.StringStream): ast.Location {
  const start = pos(stream);
  const end = start;
  return { start, end };
}

export function pos(stream: cm.StringStream): cm.Position {
  return cm.Pos(line(stream), stream.pos);
}

function line(stream: cm.StringStream) {
  return (stream as any).lineOracle.line;
}
