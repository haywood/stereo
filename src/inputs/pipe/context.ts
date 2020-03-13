import { StringStream } from 'codemirror';
import CodeMirror from 'codemirror';
import endent from 'endent';
import { cloneDeep, isEmpty } from 'lodash';

import debug from '../../debug';
import { pp } from '../../pp';
import * as ast from './ast';
import * as st from './state';
import { complete, eoi, loc, pos } from './util';

type Then<T> = (ctx: Context<T>) => void;

export class Context<T> {
  static pipe(then: Then<ast.PipeNode>) {
    return Context.start(new st.PipeState(), then);
  }

  static scalar(then: Then<ast.Scalar>) {
    return Context.start(new st.ScalarState(), then);
  }

  static start<T>(root: st.NonTerminal<T>, then: Then<T>): Context<T> {
    root.location = { start: 0, end: 0 };
    return new Context(root, then);
  }


  constructor(
    private readonly root: st.NonTerminal<T>,
    private readonly then: Then<T>,
    private readonly stack: st.State[] = [],
    private readonly parents: number[] = [],
    private readonly expanded: Set<st.NonTerminal> = new Set()
  ) {
  }

  resolve() {
    const value = this.root.resolve();
    console.info('resolve()', cloneDeep(this), cloneDeep(value));
    this.root.reset();
    this.root.location = {start: 0, end: 0};
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
      expanded
    );
  }

  private apply(curr: st.State, stream: StringStream) {
    if (curr && !curr.location) {
      curr.location = loc(stream);
    }

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
      this.parent.resolveChild(curr, stream);
    } else {
      this.stack.push(new st.RejectState(curr));
    }

    if (curr instanceof st.RejectState) {
      console.warn(
        `encountered error on stack`,
        stream,
        curr.clone(),
        this.clone()
      );
    }

    if (eoi(stream)) {
      let last;
      while (curr = this.stack.pop()) {
        this.parent.resolveChild(curr, stream);
        last = curr;
      }

      if (complete(this.root, stream)) {
        console.info(
          `parse complete; calling then()`,
          stream,
          last.clone(),
          this.clone()
        );
        this.then(this);
      } else {
        console.warn(
          `reached EOI, but root is incomplete`,
          stream,
          curr.clone(),
          this.clone()
        );
      }
    }

    return style;
  }

  private applyNonTerminal(curr: st.NonTerminal, stream: StringStream) {
    if (!this.expand(curr, stream)) {
      this.parent.resolveChild(curr, stream);
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
