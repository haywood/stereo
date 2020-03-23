import * as ast from './ast';
import cm from 'codemirror';

export function lint(_0, _1, editor: cm.Editor) {
  const value: ast.Node = editor.getStateAfter().resolve();
  const errors = ast.findErrors(value);
  const lints = [];

  for (const error of errors) {
    lints.push({
      message: error.message,
      severity: 'error',
      from: error.location.start,
      to: error.location.end
    });
  }

  return lints;
}
