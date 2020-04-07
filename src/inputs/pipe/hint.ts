import * as cm from 'codemirror';

import { Band } from '../../audio/band';
import * as ast from './ast';

type Hint = cm.Hint & {
  description?: Description;
};

interface Description {
  summary: string;
  args?: { name: string; description: string; required?: boolean }[];
}

export function hint(
  editor: cm.Editor,
  node: ast.PipeNode,
  variables: ast.Variables
): any {
  const cursor = editor.getCursor();
  const token = editor.getTokenAt(cursor);
  const to = cursor;
  const from = token.string.trim() ? cm.Pos(cursor.line, token.start) : to;
  const list = doHint(node, cursor, editor, variables);

  const completions = { list: list ?? [], from, to };
  cm.on(completions, 'select', onSelect);

  cm.on(completions, 'close', () => {
    document.querySelector('.hint-description')?.remove();
  });

  return completions;
}

function doHint(
  root: ast.Node,
  cursor: cm.Position,
  editor: cm.Editor,
  variables: ast.Variables
): Hint[] {
  const list = [];
  const [node] = findCursor(root, cursor);
  const { start, end } = node.location;
  const src = editor.getRange(node.location.start, node.location.end);

  console.debug({ root, cursor, node, src });

  if (Object.keys(variables).includes(src)) return list;
  if (ast.alwaysDefinedIds.has(src)) return list;

  for (const [name, description] of Object.entries(descriptions)) {
    if (!name.startsWith(src)) continue;

    const hasArgs = typeof description == 'object' && !!description.args;
    const text = hasArgs ? `${name}()` : name;
    const newCursor = {
      line: start.line + (text.match(/\n/g) ?? []).length,
      ch: text.slice(1 + text.lastIndexOf('\n')).length
    };
    if (hasArgs) newCursor.ch--;

    list.push({
      text,
      description,
      hint: () => {
        editor.replaceRange(text, start, end);
        editor.setCursor(newCursor);
      }
    });
  }

  for (const text in variables) {
    if (!text.startsWith(src)) continue;
    if (text in descriptions) continue;

    list.push({ text, from: start, to: end });
  }

  return list;
}

function findCursor(
  node: ast.Node,
  cursor: cm.Position,
  path: ast.Node[] = []
): ast.Node[] {
  if (!includes(node, cursor)) {
    return [];
  }

  path = [node, ...path];
  for (const child of node.children) {
    const result = findCursor(child, cursor, path);
    if (result.length) return result;
  }

  return path;
}

function includes(node: ast.Node, cursor: cm.Position): boolean {
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
    panel.style.right = `${window.innerWidth - rect.left}px`;
    //panel.style.width = `${window.innerWidth - rect.right - 16}px`;

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

export const descriptions: Record<string, Description | string> = {
  // Builtin Constants
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
  [ast.FnName.AMIX]: {
    summary:
      'Returns one value when audio is enabled and another when it is disabled.',
    args: [
      {
        name: 'no_audio',
        description: 'The value to return when audio is *disabled*.'
      },
      {
        name: 'with_audio',
        description: 'The value to return when audio is *enabled*.'
      }
    ]
  },

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
        name: 'r0',
        description: 'the radius of the first cross section.'
      },
      {
        name: 'r',
        description:
          "the ratio between a cross-section's size and that of the preceding one."
      }
    ]
  },

  // Audio variables
  [ast.BandName
    .LOW]: `Average power of the audio frequencies between ${Band.low.lo}Hz and ${Band.low.hi}Hz.`,

  [ast.BandName
    .MID]: `Average power of the audio frequencies between ${Band.mid.lo}Hz and ${Band.mid.hi}Hz.`,

  [ast.BandName
    .HIGH]: `Average power of the audio frequencies between ${Band.high.lo}Hz and ${Band.high.hi}Hz.`,

  [ast.BandName
    .FULL]: `Average power of the audio frequencies between ${Band.low.lo}Hz and ${Band.high.hi}Hz.`,

  [ast.ColorNode.Mode.HSV]: {
    summary: `Set the color from hue, saturation, and value.`,
    args: [
      { name: 'hue', description: 'The hue as a number between 0 and 1.' },
      {
        name: 'saturation',
        description: 'The saturation as a number between 0 and 1.'
      },
      { name: 'value', description: 'The value as a number between 0 and 1.' }
    ]
  }
};
