import * as cm from 'codemirror';

import * as ast from './ast';

type Hint = cm.Hint & {
  description?: Description;
};

interface Description {
  summary: string;
  args?: { name: string; description: string; required?: boolean };
}

export function hint(
  editor: cm.Editor,
  node: ast.PipeNode | ast.Scalar,
  variables: ast.Variables
): cm.Hints {
  let list: Hint[];
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const to = cursor;
  const from = token.string.trim() ? cm.Pos(cursor.line, token.start) : to;

  if (node instanceof ast.PipeNode) {
    list = hintPipe(node, cursor, editor, variables);
  } else {
    // assume Scalar
    list = hintScalar(node, cursor, editor, variables);
  }

  const completions = { list: list ?? [], from, to };
  cm.on(completions, 'select', onSelect);

  cm.on(completions, 'close', () => {
    document.querySelector('.hint-description')?.remove();
  });

  return completions;
}

function hintPipe(node: ast.PipeNode, cursor, editor, variables) {
  const statement = node.statements.find(s => includes(s, cursor, editor));
  if (statement) {
    return hintStatement(statement, cursor, editor, variables);
  } else {
    return hintEmptyStatement('', cursor, cursor, editor, variables);
  }
}

function hintStatement(node: ast.Statement, cursor, editor, variables) {
  const line = editor.getLine(cursor.line);
  const after = line.slice(cursor.ch);

  console.debug({ node, cursor });
  if (node instanceof ast.AssignmentNode) {
    return hintAssignment(node, cursor, editor, variables);
  } else if (node instanceof ast.StepNode) {
    return hintStep(node, cursor, editor, variables);
  } else if (/^\s*=/.test(after)) {
    // an assignment missing lhs
    return hintId(ast.id('', node.location), cursor, editor, variables, []);
  } else if (!after.trim()) {
    const { start, end } = node.location;
    return hintEmptyStatement(node.message, start, end, editor, variables);
  }
}

function hintEmptyStatement(
  src: string,
  from: cm.Position,
  to: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables
) {
  const list = [];

  variableHints(src, variables).forEach(hint => {
    list.push(hint);
  });

  stepTypeHints(src, from, to, editor).forEach(hint => list.push(hint));

  return list;
}

function hintAssignment(
  node: ast.AssignmentNode,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables
) {
  const { name, value } = node;
  const { line, ch } = name.location.start;
  if (includes(name, cursor, editor)) {
    for (const id in variables) {
      if (id == name.id) {
        return [];
      }
    }

    for (const id of ast.alwaysDefinedIds) {
      if (id == name.id) {
        return [];
      }
    }

    return variableHints(name.id, variables);
  } else if (includes(value, cursor, editor)) {
    return hintScalar(value, cursor, editor, variables);
  }
}

function hintStep(
  node: ast.StepNode,
  cursor: cm.Position,
  editor: cm.Editor,
  variables
) {
  return hintFnLike(
    node.type,
    node,
    // First arg is synthetic dimension arg
    node.args.slice(1),
    cursor,
    editor,
    variables
  );
}

function hintScalar(
  node: ast.Scalar,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables,
  ancestors = []
) {
  switch (node.kind) {
    case 'arith':
      return hintArith(node, cursor, editor, variables, ancestors);
    case 'number':
      return [];
    case 'fn':
      return hintFn(node, cursor, editor, variables, ancestors);
    case 'id':
      return hintId(node, cursor, editor, variables, ancestors);
    case 'paren':
      return hintParen(node, cursor, editor, variables, ancestors);
    case 'error':
      return hintError(node, cursor, editor, variables, ancestors);
  }
}

function hintArith(
  node: ast.ArithNode,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables,
  ancestors
) {
  const {
    operands: [a, b]
  } = node;

  if (includes(a, cursor, editor)) {
    return hintScalar(a, cursor, editor, variables, [...ancestors, node]);
  } else {
    return hintScalar(b, cursor, editor, variables, [...ancestors, node]);
  }
}

function hintFn(
  node: ast.FnNode,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables,
  ancestors
) {
  return hintFnLike(
    node.name,
    node,
    node.args,
    cursor,
    editor,
    variables,
    ancestors
  );
}

function hintFnLike(
  name: string,
  node: ast.FnNode | ast.StepNode,
  args: ast.Scalar[],
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables,
  ancestors: ast.Node[] = []
) {
  const idx = args.findIndex(a => includes(a, cursor, editor));
  const before = editor.getLine(cursor.line).slice(0, cursor.ch);
  const isLparen = /\(\s*$/.test(before);
  const isComma = /,\s*$/.test(before);
  const needsTerm = isLparen || isComma;
  const knownArgs = descriptions[name]?.args?.length ?? 1;
  let list;

  if (idx >= 0) {
    list = hintScalar(args[idx], cursor, editor, variables, [
      ...ancestors,
      node
    ]);
  } else if (needsTerm && args.length < knownArgs) {
    list = hintScalar(ast.id('', node.location), cursor, editor, variables, [
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

function hintId(
  node: ast.IdNode,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables,
  ancestors: ast.Node[]
) {
  const list = [];

  for (const id in variables) {
    if (id == node.id) {
      return list;
    }
  }

  for (const id of ast.alwaysDefinedIds) {
    if (id == node.id) {
      return list;
    }
  }

  addConstants(list, node.id);
  variableHints(node.id, variables).forEach(hint => list.push(hint));
  addFnNames(list, node.id, node.location, editor);

  return list;
}

function hintParen(node, cursor, editor, variables, ancestors) {}

function hintError(
  node: ast.ErrorNode,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables,
  ancestors: ast.Node[]
) {
  const parent = ancestors.pop();
  const ctor = parent.constructor;
  if ([ast.ArithNode, ast.StepNode, ast.FnNode].includes(ctor)) {
    return hintId(
      ast.id(node.message, node.location),
      cursor,
      editor,
      variables,
      ancestors
    );
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

function addConstants(list: Hint[], src: string) {
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

function variableHints(src: string, variables: ast.Variables): Hint[] {
  const list = [];

  Object.values(ast.BuiltinVariable)
    .filter(name => name.startsWith(src))
    .forEach(name => {
      list.push({
        text: name,
        displayText: name,
        description: descriptions[name]
      });
    });

  for (const name in variables) {
    if (ast.alwaysDefinedIds.has(name)) continue;

    if (name.startsWith(src)) {
      list.push({
        text: name,
        displayText: name,
        description: descriptions[name]
      });
    }
  }

  return list;
}

function addFnNames(
  list: Hint[],
  src: string,
  { start: from, end: to }: ast.Location,
  editor: cm.Editor
) {
  for (const name of Object.values(ast.FnName)) {
    if (name.startsWith(src)) {
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

  if (cursor.line < start.line || cursor.line > end.line) {
    return false;
  } else if (start.line == end.line) {
    return start.ch <= cursor.ch && cursor.ch <= end.ch;
  } else if (cursor.line == start.line) {
    return cursor.ch >= start.ch;
  } else if (cursor.line == end.line) {
    return cursor.ch <= end.ch;
  } else {
    return true;
  }
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
    panel.style.width = `${window.innerWidth - rect.right - 16}px`;

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

export const descriptions = {
  // Builtin Constants
  [ast.BuiltinConstant.E]: "Euler's number.",
  [ast.BuiltinConstant.EPSILON]:
    'The smallest number that the system can represent. Useful as an alternative to 0 in step().',
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
      {
        name: 'i',
        description: 'the i part of the quaternion.',
        required: false
      },
      {
        name: 'j',
        description: 'the j part of the quaternion.',
        required: false
      },
      {
        name: 'k',
        description: 'the k part of the quaternion.',
        required: false
      }
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
        description: 'the zero-indexed second axis of the plane of rotation.',
        required: false
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
