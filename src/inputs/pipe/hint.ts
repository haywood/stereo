import * as cm from 'codemirror';

import * as ast from './ast';
import { Context } from './context';

export function hint(editor: cm.Editor, node: Node): cm.Hints {
  let list: (string | cm.Hint)[];
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const from = cm.Pos(cursor.line, token.start);
  const to = cursor;

  console.debug('hint()', { node, cursor });

  if (node instanceof ast.PipeNode) {
    list = hintPipe(node as ast.PipeNode, cursor, editor) ?? [];
  } else {
    // assume Scalar
    list = hintScalar((node as any) as ast.Scalar, cursor, editor) ?? [];
  }

  return { list, from, to };
}

function hintPipe({ statements }: ast.PipeNode, cursor, editor) {
  console.debug('hint/pipe()', { statements });
  const statement = statements.find(s => ast.includes(s, cursor));
  return statement ? hintStatement(statement, cursor, editor) : [];
}

function hintStatement(node: ast.Statement, cursor, editor) {
  console.debug('hint/statement()', { node });
  switch (node.kind) {
    case 'assignment':
      return hintAssignment(node, cursor, editor);
  }
}

function hintAssignment({ name, value }: ast.AssignmentNode, cursor, editor) {
  console.debug('hint/assignment()', { name, value, cursor });
  if (ast.includes(value, cursor)) {
    return hintScalar(value, cursor, editor);
  }
  return [];
}

function hintScalar(node: ast.Scalar, cursor, editor, ancestors = []) {
  console.debug('hint/scalar()', node);
  switch (node.kind) {
    case 'arith':
      return hintArith(node, cursor, ancestors);
    case 'number':
      return [];
    case 'fn':
      return hintFn(node, cursor, ancestors);
    case 'id':
      return hintId(node, cursor, ancestors, editor);
    case 'paren':
      return hintParen(node, cursor, ancestors);
    case 'element':
      return hintElement(node, cursor, ancestors);
    case 'error':
      return hintError(node, cursor, ancestors);
  }
}

function hintArith(node: ast.ArithNode, cursor, ancestors) {
  console.debug('hint/arith()', node);
  const {
    operands: [a, b]
  } = node;

  if (ast.includes(a, cursor)) {
    return hintScalar(a, cursor, [...ancestors, node]);
  } else {
    return hintScalar(b, cursor, [...ancestors, node]);
  }
}

function hintFn(node: ast.FnNode, cursor, ancestors) {
  console.debug('hint/fn()', node);
  const arg = node.args.find(a => ast.includes(a, cursor));
  if (arg) {
    return hintScalar(arg, [...ancestors, node]);
  } else {
    return [')'];
  }
}

function hintProperty(node, cursor, ancestors) {
  console.debug('hint/property()', node);
}

function hintId(node, cursor, ancestors, editor) {
  console.debug('hint/id()', node);
  const list = [];

  addConstants(list, node.id);
  addVariables(list, node.id);
  addFnNames(list, node.id, node.region, editor);

  return list;
}

function hintParen(node, cursor, ancestors) {
  console.debug('hint/paren()', node);
}

function hintElement(node, cursor, ancestors) {
  console.debug('hint/element()', node);
}

function hintError(node: ast.ErrorNode, cursor, ancestors) {
  console.debug('hint/error()', {node});
}

function addConstants(list, src) {
  for (const name of Object.values(ast.BuiltinConstant)) {
    if (name.startsWith(src)) {
      list.push(name);
    }
  }

  console.debug('hint/addConstants()', src, list);
}

function addVariables(list, src) {
  for (const name of Object.values(ast.BuiltinVariable)) {
    if (name.startsWith(src)) {
      list.push(name);
    }
  }

  console.debug('hint/addVariables()', src, list);
}

function addFnNames(list, src, region, editor: cm.Editor) {
  for (const name of Object.values(ast.FnName)) {
    if (name.startsWith(src)) {
      const text = `${name}()`;
      list.push({
        text, hint: () => {
          const from = cm.Pos(region.start.line, region.start.column);
          const to = cm.Pos(region.end.line, region.end.column);
          editor.replaceRange(text, from, to);
          editor.setCursor({line: to.line, ch: from.ch + name. length + 1})
        }
      });
    }
  }

  console.debug('hint/addFnNames()', src, list);
}
