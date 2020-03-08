import assert from 'assert';

import endent from 'endent';

import debug from '../../debug';
import { pp } from '../../pp';
import { Error } from './error';
import { NonTerminal } from './non_terminal';
import { Pipe } from './pipe';
import { Scalar } from './scalar';
import { State } from './state';

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
    let style;

    if (stream.eatSpace()) {
      style = 'space';
    } else if (this.peek()) {
      style = this.applyFromQueue(stream);
    } else {
      this.applyFromStack(stream);
    }

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

  private applyFromQueue(stream): string {
    const state = this.dequeue(stream);
    const queued = this.queue.length;
    const style = state.apply(stream, this);

    if (style) {
      this.evaluate(state, stream);
    } else if (state instanceof NonTerminal) {
      this.push(state);
    } else if (!this.peek()) {
      this.applyFromStack(stream);
    }

    // any node that doesn't match should enqueue something
    if (!style && this.queue.length == queued) this.enqueue(new Error());

    return style;
  }

  private applyFromStack(stream): void {
    const pending = this.pop();
    if (this.stack.length) {
      this.evaluate(pending, stream);
    } else {
      this.enqueue(pending);
    }
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

    const value = this.top().evaluate(this, stream);
    console.debug('Context.drain()\n', this, '\n\tproduced', value);

    this.then(value);
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
