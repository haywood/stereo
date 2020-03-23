import * as ast from './ast';
import cm from 'codemirror';

export function lint(_0, _1, editor: cm.Editor) {
  const value: ast.Node = editor.getStateAfter().resolve();
  const errors = findErrors(value);
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

export function findErrors(node: ast.Node): ast.ErrorNode[] {
  if (node instanceof ast.PipeNode) {
    return [
      ...node.assignments.map(findErrors).flat(),
      ...node.steps.map(findErrors).flat(),
      ...node.errors
    ];
  } else if (node instanceof ast.AssignmentNode) {
    return [...findErrors(node.name), ...findErrors(node.value)];
  } else if (node instanceof ast.StepNode) {
    return node.args.map(findErrors).flat();
  } else if (node instanceof ast.ArithNode) {
    return node.operands.map(findErrors).flat();
  } else if (node instanceof ast.FnNode) {
    return node.args.map(findErrors).flat();
  } else if (node instanceof ast.ParenNode) {
    return findErrors(node.scalar);
  } else if (node instanceof ast.IdNode || node instanceof ast.NumberNode) {
    return [];
  } else {
    return [node];
  }
}

