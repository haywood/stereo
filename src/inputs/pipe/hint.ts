import * as cm from 'codemirror';

import * as ast from './ast';
import { Context } from './context';

type Hint = cm.Hint & {
  description?: any;
};

export function hint(
  editor: cm.Editor,
  node: ast.PipeNode | ast.Scalar
): cm.Hints {
  let list: Hint[];
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const to = cursor;
  const from = token.string.trim() ? cm.Pos(cursor.line, token.start) : to;

  if (node instanceof ast.PipeNode) {
    list = hintPipe(node, cursor, editor);
  } else {
    // assume Scalar
    list = hintScalar(node, cursor, editor);
  }

  const completions = { list: list ?? [], from, to };
  cm.on(completions, 'select', onSelect);

  cm.on(completions, 'close', () => {
    document.querySelector('.hint-description')?.remove();
  });

  return completions;
}

function hintPipe(node: ast.PipeNode, cursor, editor) {
  const statement = node.statements.find(s => includes(s, cursor, editor));
  if (statement) {
    return hintStatement(statement, cursor, editor);
  } else {
    return hintEmptyStatement('', cursor, cursor, editor);
  }
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
    const { start, end } = node.location;
    return hintEmptyStatement(
      node.src,
      offset2pos(start, editor),
      offset2pos(end, editor),
      editor
    );
  }
}

function hintEmptyStatement(
  src: string,
  from: cm.Position,
  to: cm.Position,
  editor: cm.Editor
) {
  const list = [];

  variableHints(src, editor).forEach(hint => {
    list.push(hint);
  });

  stepTypeHints(src, from, to, editor).forEach(hint => list.push(hint));

  return list;
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
    variableHints(name.id, editor).forEach(hint => list.push(hint));
    return list;
  } else if (includes(value, cursor, editor)) {
    return hintScalar(value, cursor, editor);
  }
}

function hintStep(node: ast.StepNode, cursor: cm.Position, editor: cm.Editor) {
  return hintFnLike(
    node.type,
    node,
    // First arg is synthetic dimension arg
    node.args.slice(1),
    cursor,
    editor
  );
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
  return hintFnLike(node.name, node, node.args, cursor, editor, ancestors);
}

function hintFnLike(
  name: string,
  node: ast.FnNode | ast.StepNode,
  args: ast.Scalar[],
  cursor: cm.Position,
  editor: cm.Editor,
  ancestors = []
) {
  const idx = args.findIndex(a => includes(a, cursor, editor));
  const before = editor.getLine(cursor.line).slice(0, cursor.ch);
  const isLparen = /\(\s*$/.test(before);
  const isComma = /,\s*$/.test(before);
  const needsTerm = isLparen || isComma;
  const knownArgs = descriptions[name]?.args?.length ?? Infinity;
  let list;

  if (idx >= 0) {
    list = hintScalar(args[idx], cursor, editor, [...ancestors, node]);
  } else if (needsTerm && args.length < knownArgs) {
    list = hintScalar(ast.id('', node.location), cursor, editor, [
      ...ancestors,
      node
    ]);
  }

  if (idx == args.length - 1 && args.length < knownArgs) {
    for (const hint of list ?? []) {
      hint.text += ', ';
    }
  }

  return list;
}

function hintProperty(node, cursor, editor, ancestors) {}

function hintId(node, cursor, editor, ancestors) {
  const list = [];

  for (const id of ast.builtinIds) {
    if (id == node.id) {
      return list;
    }
  }

  addConstants(list, node.id, node.location, editor);
  variableHints(node.id, editor).forEach(hint => list.push(hint));
  addFnNames(list, node.id, node.location, editor);

  return list;
}

function hintParen(node, cursor, editor, ancestors) {}

function hintElement(node, cursor, editor, ancestors) {}

function hintError(
  node: ast.ErrorNode,
  cursor: cm.Position,
  editor: cm.Editor,
  ancestors: ast.Node[]
) {
  const parent = ancestors.pop();
  const ctor = parent.constructor;
  if ([ast.ArithNode, ast.StepNode, ast.FnNode].includes(ctor)) {
    return hintId(ast.id(node.src, node.location), cursor, editor, ancestors);
  }
}

function stepTypeHints(
  src,
  from: cm.Position,
  to: cm.Position,
  editor: cm.Editor
) {
  const list = [];

  for (const type of Object.values(ast.StepType)) {
    if (type.startsWith(src)) {
      const text = `${type}()`;
      list.push({
        text,
        hint: () => {
          editor.replaceRange(text, from, to);
          editor.setCursor({ line: to.line, ch: from.ch + type.length + 1 });
        },
        description: descriptions[type]
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
      list.push({
        text: name,
        displayText: name,
        description: descriptions[name]
      });
    }
  }
}

function variableHints(src: string, editor: cm.Editor): Hint[] {
  return Object.values(ast.BuiltinVariable)
    .filter(name => name.startsWith(src))
    .map(name => {
      return {
        text: name,
        displayText: name,
        description: descriptions[name]
      };
    });
}

function addFnNames(
  list: Hint[],
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
        },
        description: descriptions[name]
      });
    }
  }
}

function includes(
  node: ast.Node,
  cursor: cm.Position,
  editor: cm.Editor
): boolean {
  if (!node.location) return false;

  const { start, end } = node.location;
  const spos = offset2pos(start, editor);
  const epos = offset2pos(end, editor);

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

/**
 * Whether the cursor is after the given offset.
 */
function after(offset: number, cursor: cm.Position, editor: cm.Editor) {
  const pos = offset2pos(offset, editor);
  return pos.line <= cursor.line && pos.ch < cursor.ch;
}

function offset2pos(offset: number, editor: cm.Editor) {
  const prefix = editor.getValue().slice(0, offset);
  const line = prefix.match(/\n/g)?.length ?? 0;
  const ch = offset - prefix.lastIndexOf('\n') - 1;
  return cm.Pos(line, ch);
}

function onSelect(hint: Hint, el: HTMLElement) {
  if (hint.description) {
    const rect = el.parentElement.getBoundingClientRect();
    const panel = findOrAdd();

    if (typeof hint.description == 'string') {
      panel.textContent = hint.description;
    } else {
      panel.appendChild(renderDescription(hint.description));
    }

    panel.style.top = `${rect.top}px`;
    panel.style.left = `${rect.right}px`;

    function findOrAdd() {
      let d = document.querySelector<HTMLElement>('.hint-description');
      if (d) {
        d.textContent = '';
      } else {
        d = document.createElement('div');
        d.classList.add('hint-description');
        el.parentElement.classList.forEach(c => d.classList.add(c));
        document.body.appendChild(d);
      }
      return d;
    }
  }
}

function renderDescription(descr) {
  const span = document.createElement('span');
  span.textContent = descr.summary;

  if (descr.args) {
    const args = span.appendChild(document.createElement('ol'));
    for (const arg of descr.args) {
      const li = args.appendChild(document.createElement('li'));
      li.classList.add('arg');

      const name = li.appendChild(document.createElement('span'));
      name.classList.add('name');
      name.textContent = arg.name;

      const d = li.appendChild(document.createElement('span'));
      d.classList.add('description');
      d.textContent = arg.description;
    }
  }

  return span;
}

const descriptions = {
  // Builtin Constants
  [ast.BuiltinConstant.AUDIO]: 'The current audio analysis data.',
  [ast.BuiltinConstant.E]: "Euler's number.",
  [ast.BuiltinConstant.I]: 'The index of the current point.',
  [ast.BuiltinConstant.LN10]: 'Natural logarithm of 10.',
  [ast.BuiltinConstant.LN2]: 'Natural logarithm of 2.',
  [ast.BuiltinConstant.LOG10E]: 'Log base 10 of e.',
  [ast.BuiltinConstant.LOG2E]: 'Log base 2 of e.',
  [ast.BuiltinConstant.TIME]: 'Elapsed seconds from start of scene.',

  // Builtin Variables
  [ast.BuiltinVariable.N]:
    'The number of points to generate. Defaults to screen width * height.',
  [ast.BuiltinVariable.D0]:
    'The initial dimension of the generated scene. Defaults to 4.',

  // Fn Names
  [ast.FnName.ABS]: 'The absolute value funciton.',

  // Step Types
  [ast.StepType.CUBE]: {
    summary: 'Map the points onto a cube.',
    args: [{ name: 'l', description: 'the side length of the cube.' }]
  },

  [ast.StepType.LATTICE]: {
    summary: 'Map the points into a lattice.',
    args: [{ name: 'l', description: 'the side length of the lattice.' }]
  },

  [ast.StepType.QUATERNION]: {
    summary: 'Right multiples each point by the given quaternion.',
    args: [
      { name: 'r', description: 'the real part of the quaternion.' },
      { name: 'i', description: 'the i part of the quaternion.' },
      { name: 'j', description: 'the j part of the quaternion.' },
      { name: 'k', description: 'the k part of the quaternion.' }
    ]
  },

  [ast.StepType.ROTATE]: {
    summary: 'Rotate the points by the given angle in the given plane.',
    args: [
      {
        name: 'phi',
        description: 'the angle in radians through which to rotate the points.'
      },
      {
        name: 'd0',
        description: 'the zero-indexed first axis of the plane of rotation.'
      },
      {
        name: 'd1',
        description: 'the zero-indexed second axis of the plane of rotation.'
      }
    ]
  },

  [ast.StepType.SPHERE]: {
    summary: 'Map the points onto a sphere.',
    args: [{ name: 'r', description: 'the radius of the sphere.' }]
  },

  [ast.StepType.SPIRAL]: {
    summary: 'Maps the points into a spiral.',
    args: [
      {
        name: 'phi',
        description:
          'an angle in radians describing how far around the spiral to go.'
      },
      {
        name: 'r',
        description:
          'the "radius" of the spiral. Each turn around the spiral causes it to grow in magnitude by r.'
      }
    ]
  },

  [ast.StepType.STEREO]: {
    summary: 'Perform stereographic projection into the given dimension.',
    args: [
      {
        name: 'to',
        description:
          'the dimension into which to project. Can be greater than, less than, or equal to (no-op) the dimension of the previous step. If the difference between to and the previous dimension is greater than 1, then the projection is done iteratively.'
      }
    ]
  },

  [ast.StepType.TORUS]: {
    summary: 'Map the points onto a torus.',
    args: [
      {
        name: '...r',
        description:
          'the radii of the cross-sections. In total, there should be one radius for each dimension.'
      }
    ]
  }
};
