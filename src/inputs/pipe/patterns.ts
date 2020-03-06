import { re } from 're-template-tag';
import { escape } from 'xregexp';

export const ID = /[a-z][a-z0-9]*/i;
export const DEF = re`/(${ID})(\s*)(=)/i`;
export const PROPERTY = re`/\.${ID}/i`;
export const INTEGER = /[+-]?[1-9]\d*/;

// TODO still not entirely correct; probably should go back to
// the explicit INTEGER|FLOAT approach.
export const NUMBER = re`/(${INTEGER}|0)(\.\d*)?([eE]${INTEGER})?/i`;

export function or(o: object): RegExp {
  const disjunction = Object.values(o)
    .map(escape)
    .join('|');
  return new RegExp(`(${disjunction})`, 'i');
}
