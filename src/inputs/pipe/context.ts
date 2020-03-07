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
    private readonly elements: string[],
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
      this.stack.map(s => s == this.root ? root : s.clone()),
      this.queue.map(s => s == this.root ? root : s.clone()),
      this.elements.slice(),
      this.then
    );
  }

  enqueue(state: State) {
    this.queue.push(state);
  }

  private top(): State {
    return this.stack[this.stack.length - 1];
  }

  private applyFromQueue(stream): string {
    const state = this.dequeue()!;
    const queued = this.queue.length;
    const style = state.apply(stream, this);

    const queueErrorIfNoSuccessors = () => {
      if (this.queue.length == queued) {
        this.enqueue(new Error());
      }
    };

    if (style) {
      this.evaluate(state, stream);
    } else if (state instanceof NonTerminal) {
      // a non-terminal that doesn't match should enqueue something
      queueErrorIfNoSuccessors();

      this.push(state);
    } else if (!this.peek()) {
      // any node that doesn't match should enqueue something
      queueErrorIfNoSuccessors();

      this.applyFromStack(stream);
    }

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
      const pending = this.dequeue();
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

  private dequeue(): State {
    return this.queue.shift();
  }
}

function eoi(stream) {
  const lineCount = stream.lineOracle.doc.size;
  const line = stream.lineOracle.line;
  return stream.eol() && line == lineCount - 1;
}
