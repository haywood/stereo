import { StringStream } from 'codemirror';

import * as ast from './ast';
import * as st from './state';

export class Context<T> {
  static pipe() {
    return Context.start(new st.PipeState());
  }

  static scalar(variables?: ast.Variables) {
    const assignmentSet = new Set(Object.keys(variables));
    return Context.start(new st.ScalarState(assignmentSet));
  }

  static start<T>( root: st.NonTerminal<T>): Context<T> {
    return new Context(root);
  }

  constructor(
    private readonly root: st.NonTerminal<T>,
    private readonly stack: st.State[] = [],
    private readonly parents: number[] = [],
    private readonly expanded: Set<st.NonTerminal> = new Set()
  ) {}

  resolve() {
    this.drain(true);
    return this.root.resolve();
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
        expanded.add(clone as st.NonTerminal);
      }
    }

    return new Context(
      this.root.clone(),
      stack,
      this.parents.slice(),
      expanded
    );
  }

  private apply(curr: st.State, stream: StringStream) {
    try {
      if (curr instanceof st.Terminal) {
        return this.applyTerminal(curr, stream);
      } else if (curr instanceof st.NonTerminal) {
        this.applyNonTerminal(curr, stream);
      } else if (!this.expand(this.root, stream)) {
        this.stack.push(new st.RejectState(stream));
      }
    } catch (err) {
      console.error(err, {ctx: this.clone(), curr: curr.clone()});
    }
  }

  private applyTerminal(curr: st.Terminal, stream: StringStream) {
    const style = curr.apply(stream);
    if (style) {
      this.parent().resolveChild(curr);
    } else {
      this.stack.push(new st.RejectState(stream));
    }

    this.drain();

    if (curr instanceof st.RejectState) {
      console.warn(
        `encountered error on stack`,
        stream,
        curr.clone(),
        this.clone()
      );
    }

    return style;
  }

  private drain(force?: boolean) {
    while (shouldDrain.call(this)) {
      const state = this.stack.pop()
      this.parent().resolveChild(state);
    }

    function shouldDrain() {
      const top = this.stack[this.stack.length - 1];
      return top && (force || this.expanded.has(top) && !top.repeatable); 
    }
  }

  private applyNonTerminal(curr: st.NonTerminal, stream: StringStream) {
    if (!this.expand(curr, stream)) {
      this.parent().resolveChild(curr);
    }

    this.drain();
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

  private parent(): st.NonTerminal {
    const parent = this.parents[this.stack.length];
    if (parent == null) {
      return this.root;
    } else {
      return this.stack[parent] as st.NonTerminal;
    }
  }
}
