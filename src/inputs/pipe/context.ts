import assert from 'assert';

import endent from 'endent';

import debug from '../../debug';
import { pp } from '../../pp';
import { Error } from './error';
import { NonTerminal } from './non_terminal';
import { Pipe } from './pipe';
import { Scalar } from './scalar';
import { State } from './state';
import { Terminal } from './terminal';

const ctxs = [];
debug('pipe_ctxs', ctxs);

export class Context {
  constructor(
    readonly root: NonTerminal,
    private readonly stack: NonTerminal[],
    private readonly queue: State[],
    readonly states: { [index: number]: State }[],
    private readonly then: (ast) => void
  ) {
    ctxs.push(this);
  }

  static pipe(then: (ast) => void): Context {
    const root = new Pipe();
    const ctx = new Context(root, [], [], [], then);
    ctx.enqueue(root);
    return ctx;
  }

  static scalar(then: (ast) => void): Context {
    const root = new Scalar();
    const ctx = new Context(root, [], [], [], then);
    ctx.enqueue(root);
    return ctx;
  }

  apply(stream): string {
    const style = stream.eatSpace() ? 'space' : this._apply(stream);

    if (eoi(stream)) {
      this.drain(stream);
    }

    return style;
  }

  clone(): Context {
    console.debug(this, 'cloning');
    const root = this.root.clone();
    return new Context(
      root,
      this.stack.map(s => (s == this.root ? root : s.clone())),
      this.queue.map(s => (s == this.root ? root : s.clone())),
      this.states.map(line => {
        return Object.entries(line).reduce((memo, [ch, state]) => {
          memo[ch] = state;
          return memo;
        }, {});
      }),
      this.then
    );
  }

  enqueue(state: State) {
    this.queue.push(state);
  }

  top(): State {
    return this.stack[this.stack.length - 1];
  }

  private _apply(stream) {
    const curr = this.dequeue(stream);
    let style = curr?.apply(stream, this);

    if (style) {
      this.evaluate(curr, stream);
    } else if (curr instanceof Terminal) {
      const error = new Error();
      style = error.apply(stream, this);
      this.evaluate(error, stream);
    } else if (curr instanceof NonTerminal) {
      this.push(curr);
    } else if (this.stack.length > 1) {
      this.evaluate(this.pop(), stream);
    } else {
      this.enqueue(this.pop());
    }

    return style;
  }

  private drain(stream) {
    const { queue, stack } = this;

    while (queue.length > 1) {
      const pending = this.dequeue(stream);
      this.evaluate(pending, stream);
    }

    while (stack.length > 1) {
      const pending = this.pop();
      this.evaluate(pending, stream);
    }

    this.then(this);
  }

  private evaluate(state: State, stream) {
    const result = state.evaluate(this, stream);
    if (result) this.top().values.push(result);
  }

  private peek(): State {
    return this.queue[0];
  }

  private pop(): State {
    return this.stack.pop();
  }

  private push(state: NonTerminal) {
    return this.stack.push(state);
  }

  private dequeue(stream): State {
    const state = this.queue.shift();
    if (state) {
      const line = stream.lineOracle.line;
      const ch = stream.column();
      if (!this.states[line]) this.states[line] = {};
      this.states[line][ch] = state;
      for (const ch0 in this.states[line]) {
        if (ch0 > ch) delete this.states[line][ch0];
      }
    }
    return state;
  }
}

function eoi(stream) {
  const lineCount = stream.lineOracle.doc.size;
  const line = stream.lineOracle.line;
  return stream.eol() && line == lineCount - 1;
}
