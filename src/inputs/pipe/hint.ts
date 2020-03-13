import * as cm from 'codemirror';

import * as ast from './ast';
import { Context } from './context';

export function hint(editor: cm.Editor, node: ast.Node): cm.Hints {
  let list: (string | cm.Hint)[];
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const to = cursor;
  const from = token.string.trim() ? cm.Pos(cursor.line, token.start) : to;

  debug('hint', node, cursor, editor, []);

  if (node instanceof ast.PipeNode) {
    list = hintPipe(node as ast.PipeNode, cursor, editor) ?? [];
  } else {
    // assume Scalar
    list = hintScalar((node as any) as ast.Scalar, cursor, editor) ?? [];
  }

  return { list, from, to };
}

function hintPipe(node: ast.PipeNode, cursor, editor) {
  debug('pipe', node, cursor, editor, []);
  const statement = node.statements.find(s => includes(s, cursor, editor));
  return statement ? hintStatement(statement, cursor, editor) : [];
}

function hintStatement(node: ast.Statement, cursor, editor) {
  debug('statement', node, cursor, editor, []);
  switch (node.kind) {
    case 'assignment':
      return hintAssignment(node, cursor, editor);
  }
}

function hintAssignment(node: ast.AssignmentNode, cursor, editor) {
  debug('assignment', node, cursor, editor, []);
  const { name, value } = node;
  if (includes(value, cursor, editor)) {
    return hintScalar(value, cursor, editor);
  }
  return [];
}

function hintScalar(node: ast.Scalar, cursor, editor, ancestors = []) {
  debug('scalar', node, cursor, editor, ancestors);
  switch (node.kind) {
    case 'arith':
      return hintArith(node, cursor, editor, ancestors);
    case 'number':
      return [];
    case 'fn':
      return hintFn(node, cursor, editor, ancestors);
    case 'id':
      return hintId(node, cursor, editor, ancestors);
    case 'paren':
      return hintParen(node, cursor, ancestors);
    case 'element':
      return hintElement(node, cursor, ancestors);
    case 'error':
      return hintError(node, cursor, editor, ancestors);
  }
}

function hintArith(
  node: ast.ArithNode,
  cursor: cm.Position,
  editor: cm.Editor,
  ancestors
) {
  debug('arith', node, cursor, editor, ancestors);
  const {
    operands: [a, b]
  } = node;

  if (includes(a, cursor, editor)) {
    return hintScalar(a, cursor, editor, [...ancestors, node]);
  } else {
    return hintScalar(b, cursor, editor, [...ancestors, node]);
  }
}

function hintFn(node: ast.FnNode, cursor, editor, ancestors) {
  debug('fn', node, cursor, editor, ancestors);
  const arg = node.args.find(a => includes(a, cursor, editor));
  if (arg) {
    return hintScalar(arg, cursor, editor, [...ancestors, node]);
  } else {
    return [')'];
  }
}

function hintProperty(node, cursor, editor, ancestors) {
  debug('property', node, cursor, editor, ancestors);
}

function hintId(node, cursor, editor, ancestors) {
  debug('id', node, cursor, editor, ancestors);
  const list = [];

  addConstants(list, node.id, node.location, editor);
  addVariables(list, node.id, node.location, editor);
  addFnNames(list, node.id, node.location, editor);

  return list;
}

function hintParen(node, cursor, ancestors) {
  debug('paren', node, cursor, editor, ancestors);
}

function hintElement(node, cursor, ancestors) {
  debug('element', node, cursor, editor, ancestors);
}

function hintError(
  node: ast.ErrorNode,
  cursor,
  editor: cm.Editor,
  ancestors: ast.Node[]
) {
  const parent = ancestors.pop();
  const list = [];
  if (parent instanceof ast.ArithNode) {
    hintId(ast.id('', node.location), cursor, editor, ancestors);
  }
  debug('error', node, cursor, editor, ancestors);
  return list;
}

function addConstants(
  list,
  src,
  { start, end }: ast.Location,
  editor: cm.Editor
) {
  for (const name of Object.values(ast.BuiltinConstant)) {
    if (name.startsWith(src)) {
      list.push(name);
    }
  }

  console.debug('hint/addConstants()', src, list);
}

function addVariables(
  list,
  src,
  { start, end }: ast.Location,
  editor: cm.Editor
) {
  for (const name of Object.values(ast.BuiltinVariable)) {
    if (name.startsWith(src)) {
      list.push(name);
    }
  }

  console.debug('hint/addVariables()', src, list);
}

function addFnNames(
  list: (string | cm.Hint)[],
  src: string,
  { start, end }: ast.Location,
  editor: cm.Editor
) {
  for (const name of Object.values(ast.FnName)) {
    if (name.startsWith(src)) {
      const from = offset2pos(start, editor);
      const to = offset2pos(end, editor);
      const text = `${name}()`;
      list.push({
        text,
        hint: () => {
          editor.replaceRange(text, from, to);
          editor.setCursor({ line: to.line, ch: from.ch + name.length + 1 });
        }
      });
    }
  }

  console.debug('hint/addFnNames()', src, list);
}

function includes(node: ast.Node, cursor: cm.Position, editor): boolean {
  if (!node.location) return false;

  const { start, end } = node.location;
  const spos = offset2pos(start, editor);
  const epos = offset2pos(end, editor);

  debug('includes', node, cursor, editor, []);

  if (cursor.line < spos.line || cursor.line > epos.line) {
    return false;
  } else if (spos.line == epos.line) {
    return spos.ch <= cursor.ch && cursor.ch <= epos.ch;
  } else if (cursor.line == spos.line) {
    return cursor.ch >= spos.ch;
  } else if (cursor.line == epos.line) {
    return cursor.ch <= epos.ch;
  } else {
    return true;
  }
}

function offset2pos(offset: number, editor: cm.Editor) {
  const prefix = editor.getValue().slice(0, offset);
  const line = prefix.match(/\n/g)?.length ?? 0;
  const ch = offset - prefix.lastIndexOf('\n') - 1;
  return cm.Pos(line, ch);
}

function debug(name, node: ast.Node, cursor, editor, ancestors) {
  console.debug(`hint/${name}()`, {
    node,
    cursor,
    ancestors,
    start: offset2pos(node.location.start, editor),
    end: offset2pos(node.location.end, editor),
    editor
  });
}
