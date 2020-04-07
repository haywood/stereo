import cm from 'codemirror';

import * as ast from './ast';
import { descriptions } from './hint';

export function lint(value: ast.Node) {
  const errors = findErrors(value);
  const lints = [];

  for (const { error } of errors) {
    lints.push({
      message: error.message,
      severity: 'error',
      from: error.location.start,
      to: error.location.end
    });
  }

  return lints;
}

// TODO also check for semantic errors
// e.g. wrong number of function args
export type Errors = {
  error: ast.ErrorNode;
  path: ast.Node[];
}[];

export function findErrors(node: ast.Node, path: ast.Node[] = []): Errors {
  const newPath = [...path, node];
  if (node instanceof ast.PipeNode) {
    return [
      ...node.assignments.map(n => findErrors(n, newPath)).flat(),
      ...node.steps.map(n => findErrors(n, newPath)).flat(),
      ...node.errors.map(error => ({ error, path: [node] }))
    ];
  } else if (node instanceof ast.AssignmentNode) {
    return [
      ...findErrors(node.name, newPath),
      ...findErrors(node.value, newPath)
    ];
  } else if (node instanceof ast.StepNode) {
    return findErrorsInStep(node, path);
  } else if (node instanceof ast.ArithNode) {
    return node.operands.map(n => findErrors(n, newPath)).flat();
  } else if (node instanceof ast.FnNode) {
    return node.args.map(n => findErrors(n, newPath)).flat();
  } else if (node instanceof ast.ParenNode) {
    return findErrors(node.scalar);
  } else if (node instanceof ast.IdNode || node instanceof ast.NumberNode) {
    return [];
  } else {
    return [{ error: node, path }];
  }
}

function findErrorsInStep(node: ast.StepNode, path: ast.Node[]): Errors {
  const errors = node.args.map(n => findErrors(n, [...path, node])).flat();
  const type = node.type;
  const description = descriptions[type];

  if (typeof description != 'object' || !description.args) {
    return errors;
  }

  const max = description.args.length;
  const min = description.args.filter(a => a.required != false).length;
  const found = node.args.length;

  if (min > found || found > max) {
    let message = `wrong number of arguments to ${type}. `;

    if (min == max) {
      message += `expected ${min}, but found ${found}`;
    } else {
      message = `expected between ${min} and ${max}, but found ${found}`;
    }

    errors.push({
      error: ast.error(message, node.toString(), node.location),
      path
    });
  }

  return errors;
}
