import { Pos, StringStream } from 'codemirror';
import * as ast from './ast';
import { isEqual } from 'lodash';

import { State } from './state';

export function peek(pattern, stream: StringStream) {
  return stream.match(pattern, false);
}

export function loc(stream: StringStream): ast.Location {
  return {line: line(stream), column: stream.pos};
}

export function eoi(stream: StringStream) {
  return stream.eol() && line(stream) == lines(stream) - 1;
}

export function complete(state: State, stream: StringStream) {
  const { start, end } = state;

  return (
    start?.line == 0 &&
    start?.column == 0 &&
    end?.line == lines(stream) - 1 &&
    end?.column == length(stream, end.line)
  );
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
