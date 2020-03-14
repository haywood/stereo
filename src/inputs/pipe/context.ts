import { StringStream } from 'codemirror';
import cm from 'codemirror';
import endent from 'endent';
import { cloneDeep, isEmpty } from 'lodash';

import debug from '../../debug';
import { pp } from '../../pp';
import * as ast from './ast';
import * as st from './state';
import { complete, eoi, loc, pos } from './util';

type Then<T> = (ctx: Context<T>) => void;

export class Context<T> {
  static pipe(src: string, then: Then<ast.PipeNode>) {
    return Context.start(new st.PipeState(), src, then);
  }

  static scalar(src: string, then: Then<ast.Scalar>) {
    return Context.start(new st.ScalarState(), src, then);
  }

  static start<T>(
    root: st.NonTerminal<T>,
    src: string,
    then: Then<T>
  ): Context<T> {
    return new Context(root, src, then);
  }

  constructor(
    private readonly root: st.NonTerminal<T>,
    private readonly src: string,
    private readonly then: Then<T>,
    private readonly stack: st.State[] = [],
    private readonly parents: number[] = [],
    private readonly expanded: Set<st.NonTerminal> = new Set()
  ) {}

  resolve() {
    const value = this.root.resolve();
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

  clone(src: string) {
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
      src,
      this.then,
      stack,
      this.parents.slice(),
      expanded
    );
  }

  private apply(curr: st.State, stream: StringStream) {
    if (curr instanceof st.Terminal) {
      return this.applyTerminal(curr, stream);
    } else if (curr instanceof st.NonTerminal) {
      this.applyNonTerminal(curr, stream);
    } else if (!this.expand(this.root, stream)) {
      this.stack.push(new st.RejectState(stream, this.src));
    }
  }

  private applyTerminal(curr: st.Terminal, stream: StringStream) {
    const style = curr.apply(stream, this.src);
    if (style) {
      this.parent.resolveChild(curr, stream);
    } else {
      this.stack.push(new st.RejectState(stream, this.src));
    }

    if (curr instanceof st.RejectState) {
      console.warn(
        `encountered error on stack`,
        stream,
        curr.clone(),
        this.clone(this.src)
      );
    }

    if (eoi(stream, this.src)) {
      this.drain(stream);
    }

    return style;
  }

  private drain(stream: StringStream) {
    let state;

    while (this.stack.length) {
      state = this.stack.pop();
      if (!state.location) state.location = loc(stream, this.src);
      this.parent.resolveChild(state, stream);
    }

    if (complete(this.root, stream, this.src)) {
      this.then(this);
    } else {
      console.warn(
        `reached EOI, but root is incomplete`,
        stream,
        state.clone(),
        this.clone(this.src)
      );
    }
  }

  private applyNonTerminal(curr: st.NonTerminal, stream: StringStream) {
    if (!this.expand(curr, stream)) {
      this.parent.resolveChild(curr, stream);
    }
  }

  private expand(curr: st.NonTerminal, stream: StringStream) {
    if (this.expanded.has(curr) && !curr.repeatable) return false;

    const successors = curr.successors(stream, this.src);
    this.expanded.add(curr);

    if (stream.current()) {
      console.error(
        'non-terminal advanced the stream',
        this.clone(this.src),
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
