import { StringStream } from 'codemirror';
import { cloneDeep, isEmpty } from 'lodash';
import { eoi, complete } from './util';
import CodeMirror from 'codemirror';
import endent from 'endent';

import debug from '../../debug';
import { pp } from '../../pp';
import * as ast from './ast';
import * as st from './state';

export class Context<T> {
  static pipe(then: (ctx: Context<ast.PipeNode>) => void) {
    return new Context(new st.PipeState(), then);
  }

  static scalar(then: (ctx: Context<ast.Scalar>) => void) {
    return new Context(new st.ScalarState(), then);
  }

  constructor(
    private readonly root: st.NonTerminal<T>,
    private readonly then: (ctx: Context<T>) => void,
    private readonly stack: st.State[] = [],
    private readonly parents: number[] = [],
    private readonly expanded: Set<st.NonTerminal> = new Set(),
  ) {}

  resolve() {
    const value = this.root.resolve();
    console.info('resolve()', cloneDeep(this), cloneDeep(value));
    this.root.reset();
    this.stack.length = 0;
    this.parents.length = 0;
    this.expanded.clear();
    return value;
  }

  token(stream: StringStream) {
    if (stream.eatSpace()) {
      return 'space';
    }

    const style = this.apply(this.stack.pop(), stream);
    return style;
  }

  clone() {
    const stack = [];
    const expanded = new Set<st.NonTerminal>();

    for (const state of this.stack) {
      const clone = state.clone();
      stack.push(clone);
      if (state instanceof st.NonTerminal && this.expanded.has(state)) {
        expanded.add(clone);
      }
    }

    return new Context(
      this.root.clone(),
      this.then,
      stack,
      this.parents.slice(),
      expanded,
    );
  }

  private apply(curr: st.State, stream: StringStream) {
    if (curr instanceof st.Terminal) {
      return this.applyTerminal(curr, stream);
    } else if (curr instanceof st.NonTerminal) {
      this.applyNonTerminal(curr, stream);
    } else if (!this.expand(this.root, stream)) {
      this.stack.push(new st.RejectState(curr));
    }
  }

  private applyTerminal(curr: st.Terminal, stream: StringStream) {
    const style = curr.apply(stream);
    if (style) {
      const value = curr.resolve();
      this.parent.addValue(value, stream);
    } else {
      this.stack.push(new st.RejectState(curr));
    }

    if (curr instanceof st.RejectState) {
      console.warn(`encountered error on stack`, stream, curr.clone(), this.clone());
    }

    if (eoi(stream)) {
      while (this.stack.length) {
        const state = this.stack.pop();
        this.parent.addValue(state.resolve(), stream);
      }

      if (complete(this.root, stream)) {
        this.then(this);
      } else {
        console.warn(`reached EOI, but root is incomplete`, stream, curr.clone(), this.clone());
      }
    }

    return style;
  }

  private applyNonTerminal(curr: st.NonTerminal, stream: StringStream) {
    if (!this.expand(curr, stream)) {
      this.parent.addValue(curr.resolve(), stream);
    }
  }

  private expand(curr: st.NonTerminal, stream: StringStream) {
    if (this.expanded.has(curr) && !curr.repeatable) return false;

    const successors = curr.successors(stream);
    this.expanded.add(curr);

    if (stream.current()) {
      console.error(
        'non-terminal advanced the stream',
        this.clone(),
        curr.clone()
      );
    }

    if (successors.length) {
      const parent = this.stack.length;
      const isRoot = curr == this.root;
      if (!isRoot) this.stack.push(curr);
      successors.reverse().forEach((s, i) => {
        if (!isRoot) this.parents[this.stack.length] = parent;
        this.stack.push(s);
      });

      return true;
    }
  }

  private get parent(): st.NonTerminal {
    const parent = this.parents[this.stack.length];
    if (parent == null) {
      return this.root;
    } else {
      return this.stack[parent] as st.NonTerminal;
    }
  }
}
