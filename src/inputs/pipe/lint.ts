import cm from 'codemirror';

import * as ast from './ast';
import { descriptions } from './hint';

export function lint(value: ast.Node) {
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

// TODO also check for semantic errors
// e.g. wrong number of function args
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
    return findErrorsInStep(node);
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

function findErrorsInStep(node: ast.StepNode) {
  const errors = node.args.map(findErrors).flat();
  const type = node.type;
  const argDescriptions = descriptions[type]?.args ?? [];
  const max = argDescriptions.length;
  const min = argDescriptions.filter(a => a.required != false).length;
  const found = node.args.length;
  let message;

  if (min != null && (min > found || found > max)) {
    if (min == max) {
      message = `wrong number of arguments to ${type}. expected ${min}, but found ${found}`;
    } else {
      message = `wrong number of arguments to ${type}. expected between ${min} and ${max}, but found ${found}`;
    }

    errors.push(ast.error(message, node.toString(), node.location));
  }

  return errors;
}
