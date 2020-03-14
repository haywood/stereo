import * as cm from 'codemirror';

import * as ast from './ast';
import { Context } from './context';

export function hint(editor: cm.Editor, node: ast.Node): cm.Hints {
  let list: cm.Hint[];
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const to = cursor;
  const from = token.string.trim() ? cm.Pos(cursor.line, token.start) : to;

  if (node instanceof ast.PipeNode) {
    list = hintPipe(node as ast.PipeNode, cursor, editor);
  } else {
    // assume Scalar
    list = hintScalar((node as any) as ast.Scalar, cursor, editor);
  }

  return { list: list ?? [], from, to };
}

function hintPipe(node: ast.PipeNode, cursor, editor) {
  const statement = node.statements.find(s => includes(s, cursor, editor));
  if (statement) return hintStatement(statement, cursor, editor);
}

function hintStatement(node: ast.Statement, cursor, editor) {
  const line = editor.getLine(cursor.line);
  const after = line.slice(cursor.ch);

  if (node instanceof ast.AssignmentNode) {
    return hintAssignment(node, cursor, editor);
  } else if (node instanceof ast.StepNode) {
    return hintStep(node, cursor, editor);
  } else if (/^\s*=/.test(after)) {
    // an assignment missing lhs
    return hintId(ast.id('', node.location), cursor, editor, []);
  } else if (!after.trim()) {
    const list = [];

    variableHints(node.src, node.location, editor).forEach(hint => {
      hint.text += ' = ';
      hint.displayText += ' = ';
      list.push(hint)
    });

    stepTypeHints(node.src, node.location, editor).forEach(hint =>
      list.push(hint)
    );

    return list;
  }
}

function hintAssignment(
  node: ast.AssignmentNode,
  cursor: cm.Position,
  editor: cm.Editor
) {
  const { name, value } = node;
  const { line, ch } = offset2pos(name.location.start, editor);
  if (includes(name, cursor, editor)) {
    const list = [];
    variableHints(name.id, name.location, editor).forEach(hint =>
      list.push(hint)
    );
    return list;
  } else if (includes(value, cursor, editor)) {
    return hintScalar(value, cursor, editor);
  }
}

function hintStep(node: ast.StepNode, cursor: cm.Position, editor: cm.Editor) {
  debug('step', node, cursor, editor, []);
}

function hintScalar(node: ast.Scalar, cursor, editor, ancestors = []) {
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
      return hintParen(node, cursor, editor, ancestors);
    case 'element':
      return hintElement(node, cursor, editor, ancestors);
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
  const {
    operands: [a, b]
  } = node;

  if (includes(a, cursor, editor)) {
    return hintScalar(a, cursor, editor, [...ancestors, node]);
  } else {
    return hintScalar(b, cursor, editor, [...ancestors, node]);
  }
}

function hintFn(
  node: ast.FnNode,
  cursor: cm.Position,
  editor: cm.Editor,
  ancestors
) {
  const idx = node.args.findIndex(a => includes(a, cursor, editor));
  const before = editor.getLine(cursor.line).slice(0, cursor.ch);
  const after = editor.getLine(cursor.line).slice(cursor.ch);
  const isRparen = /,\s*$/.test(before);
  const isComma = /,\s*$/.test(before);
  const hasRparen = /^\s*\)/.test(after);
  let list;

  if (idx >= 0) {
    return hintScalar(node.args[idx], cursor, editor, [...ancestors, node]);
  } else if (isComma) {
    return hintScalar(ast.id('', node.location), cursor, editor, [
      ...ancestors,
      node
    ]);
  }
}

function hintProperty(node, cursor, editor, ancestors) {
  debug('property', node, cursor, editor, ancestors);
}

function hintId(node, cursor, editor, ancestors) {
  debug('id', node, cursor, editor, ancestors);
  const list = [];

  addConstants(list, node.id, node.location, editor);
  variableHints(node.id, node.location, editor).forEach(hint =>
    list.push(hint)
  );
  addFnNames(list, node.id, node.location, editor);

  return list;
}

function hintParen(node, cursor, editor, ancestors) {
  debug('paren', node, cursor, editor, ancestors);
}

function hintElement(node, cursor, editor, ancestors) {
  debug('element', node, cursor, editor, ancestors);
}

function hintError(
  node: ast.ErrorNode,
  cursor: cm.Position,
  editor: cm.Editor,
  ancestors: ast.Node[]
) {
  const parent = ancestors.pop();
  debug('error', node, cursor, editor, ancestors);

  if (parent instanceof ast.ArithNode) {
    return hintId(ast.id('', node.location), cursor, editor, ancestors);
  }
}

function stepTypeHints(src, { start, end }: ast.Location, editor: cm.Editor) {
  const list = [];

  for (const type of Object.values(ast.StepType)) {
    if (type.startsWith(src)) {
      const from = offset2pos(start, editor);
      const to = offset2pos(end, editor);
      const text = `${type}()`;
      list.push({
        text,
        hint: () => {
          editor.replaceRange(text, from, to);
          editor.setCursor({ line: to.line, ch: from.ch + type.length + 1 });
        }
      });
    }
  }

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
      list.push({ text: name, displayText: name });
    }
  }
}

function variableHints(
  src: string,
  { start, end }: ast.Location,
  editor: cm.Editor
): cm.Hint[] {
  return Object.values(ast.BuiltinVariable)
    .filter(name => name.startsWith(src))
    .map(name => {
      return { text: name, displayText: name };
    });
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
